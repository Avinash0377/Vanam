/**
 * Coupon Eligibility & PDP Offers Service
 *
 * Shared logic used by:
 * - GET /api/products/[id]/offers (PDP display)
 * - POST /api/coupons/validate (cart coupon apply)
 * - Order placement re-validation (checkout)
 *
 * Single source of truth for coupon applicability — prevents drift between PDP and checkout.
 */

import prisma from '@/lib/prisma';
import { Coupon } from '@prisma/client';

// ==================== TYPES ====================

export interface ProductContext {
    id: string;
    categoryId?: string | null;
    tags?: string[];
    productType?: string;
}

export interface OfferDisplay {
    id: string;
    code: string | null;
    offerType: string;
    title: string;
    subtext: string | null;
    autoApply: boolean;
    showCode: boolean;
    minOrder: number;
    validTill: string | null;
}

// ==================== IN-MEMORY CACHE ====================

interface CacheEntry {
    data: OfferDisplay[];
    timestamp: number;
}

const offersCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Invalidate the entire offers cache.
 * Called after any coupon create/update/delete/status-toggle.
 */
export function invalidateOffersCache(): void {
    offersCache.clear();
}

/**
 * Invalidate cache for a specific product.
 */
export function invalidateOffersCacheForProduct(productId: string): void {
    offersCache.delete(productId);
}

function getCachedOffers(productId: string): OfferDisplay[] | null {
    const entry = offersCache.get(productId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        offersCache.delete(productId);
        return null;
    }
    return entry.data;
}

function setCachedOffers(productId: string, offers: OfferDisplay[]): void {
    // Prevent unbounded cache growth
    if (offersCache.size > 1000) {
        // Evict oldest 200 entries
        const entries = Array.from(offersCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < 200 && i < entries.length; i++) {
            offersCache.delete(entries[i][0]);
        }
    }
    offersCache.set(productId, { data: offers, timestamp: Date.now() });
}

// ==================== ELIGIBILITY CHECK ====================

/**
 * Check if a coupon applies to a specific product.
 * Precedence: excludedProductIds > includedProductIds > includedCategoryIds > includedTags > ALL_PRODUCTS
 */
export function checkProductEligibility(
    coupon: Pick<Coupon, 'applicabilityScope' | 'includedProductIds' | 'excludedProductIds' | 'includedCategoryIds' | 'includedTags' | 'applicableTo' | 'applicableIds'>,
    product: ProductContext,
): boolean {
    // 1. Check exclusion list first (always wins)
    if (coupon.excludedProductIds?.length > 0 && coupon.excludedProductIds.includes(product.id)) {
        return false;
    }

    // 2. Use new applicabilityScope if available, fall back to legacy applicableTo
    const scope = coupon.applicabilityScope || 'ALL_PRODUCTS';

    switch (scope) {
        case 'ALL_PRODUCTS':
            return true;

        case 'PRODUCT':
            if (coupon.includedProductIds?.length > 0) {
                return coupon.includedProductIds.includes(product.id);
            }
            // Fall back to legacy applicableIds
            if (coupon.applicableTo === 'PRODUCT' && coupon.applicableIds?.length > 0) {
                return coupon.applicableIds.includes(product.id);
            }
            return false;

        case 'CATEGORY':
            if (!product.categoryId) return false;
            if (coupon.includedCategoryIds?.length > 0) {
                return coupon.includedCategoryIds.includes(product.categoryId);
            }
            // Fall back to legacy applicableIds
            if (coupon.applicableTo === 'CATEGORY' && coupon.applicableIds?.length > 0) {
                return coupon.applicableIds.includes(product.categoryId);
            }
            return false;

        case 'COLLECTION_TAG':
            if (!product.tags || product.tags.length === 0) return false;
            if (coupon.includedTags?.length > 0) {
                const productTagsLower = product.tags.map(t => t.toLowerCase());
                return coupon.includedTags.some(tag =>
                    productTagsLower.includes(tag.toLowerCase())
                );
            }
            return false;

        default:
            return false;
    }
}

// ==================== DISPLAY TITLE GENERATION ====================

/**
 * Auto-generate a customer-facing title from coupon data.
 * Used when displayTitle is null.
 */
export function generateDisplayTitle(coupon: Pick<Coupon, 'offerType' | 'discountType' | 'discountValue' | 'minOrderValue' | 'maxDiscountAmount'>): string {
    const offerType = coupon.offerType || (coupon.discountType === 'FIXED' ? 'FLAT' : 'PERCENTAGE');
    const minOrder = coupon.minOrderValue;

    switch (offerType) {
        case 'FREE_SHIPPING':
            if (minOrder > 0) {
                return `Free shipping on orders above ₹${minOrder.toLocaleString('en-IN')}`;
            }
            return 'Free shipping on all orders';

        case 'BOGO':
            return 'Buy 1 Get 1 Free';

        case 'FLAT': {
            const value = coupon.discountValue;
            if (minOrder > 0) {
                return `Flat ₹${value.toLocaleString('en-IN')} off on orders above ₹${minOrder.toLocaleString('en-IN')}`;
            }
            return `Flat ₹${value.toLocaleString('en-IN')} off`;
        }

        case 'PERCENTAGE':
        default: {
            const pct = coupon.discountValue;
            let title = `Get ${pct}% off`;
            if (minOrder > 0) {
                title += ` on orders above ₹${minOrder.toLocaleString('en-IN')}`;
            }
            return title;
        }
    }
}

/**
 * Generate subtext from coupon data (max discount, validity info).
 * Used when displaySubtext is null.
 */
export function generateDisplaySubtext(coupon: Pick<Coupon, 'offerType' | 'discountType' | 'maxDiscountAmount'>): string | null {
    const offerType = coupon.offerType || (coupon.discountType === 'FIXED' ? 'FLAT' : 'PERCENTAGE');

    if (offerType === 'PERCENTAGE' && coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        return `Max discount ₹${coupon.maxDiscountAmount.toLocaleString('en-IN')}`;
    }

    return null;
}

// ==================== PDP OFFERS FETCHER ====================

/**
 * Get all eligible, displayable offers for a specific product.
 * This is the main function called by the PDP offers API endpoint.
 */
export async function getOffersForProduct(productId: string): Promise<OfferDisplay[]> {
    // Check cache first
    const cached = getCachedOffers(productId);
    if (cached) return cached;

    const isValidObjectId = /^[a-f\d]{24}$/i.test(productId);
    const whereClause = isValidObjectId
        ? { OR: [{ id: productId }, { slug: productId }] }
        : { slug: productId };

    // Fetch product context
    const product = await prisma.product.findFirst({
        where: whereClause,
        select: {
            id: true,
            categoryId: true,
            tags: true,
            productType: true,
        },
    });

    if (!product) {
        setCachedOffers(productId, []);
        return [];
    }

    const productContext: ProductContext = {
        id: product.id,
        categoryId: product.categoryId,
        tags: product.tags,
        productType: product.productType,
    };

    const now = new Date();

    // Fetch all coupons that could potentially be shown on PDP
    const coupons = await prisma.coupon.findMany({
        where: {
            isActive: true,
            showOnProductPage: true,
            startDate: { lte: now },
            expiryDate: { gte: now },
        },
        orderBy: [
            { sortOrder: 'desc' },
            { discountValue: 'desc' },
            { createdAt: 'desc' },
        ],
    });

    // Filter by product eligibility and usage limits
    const eligible: OfferDisplay[] = [];

    for (const coupon of coupons) {
        // Check product eligibility
        if (!checkProductEligibility(coupon, productContext)) {
            continue;
        }

        // Check global usage limit
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            continue;
        }

        // Build display object (never leak internal fields)
        const title = coupon.displayTitle || generateDisplayTitle(coupon);
        const subtext = coupon.displaySubtext || generateDisplaySubtext(coupon);

        // Determine if we should show expiry urgency (within 7 days)
        const daysUntilExpiry = Math.ceil((coupon.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const showExpiry = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

        eligible.push({
            id: coupon.id,
            code: coupon.autoApply ? null : coupon.code,
            offerType: coupon.offerType || 'PERCENTAGE',
            title: sanitizeText(title),
            subtext: subtext ? sanitizeText(subtext) : null,
            autoApply: coupon.autoApply,
            showCode: !coupon.autoApply,
            minOrder: coupon.minOrderValue,
            validTill: showExpiry ? coupon.expiryDate.toISOString() : null,
        });

        // Cap at 5 offers
        if (eligible.length >= 5) break;
    }

    setCachedOffers(productId, eligible);
    return eligible;
}

// ==================== HELPERS ====================

/**
 * Basic XSS sanitization for admin-authored text fields.
 * Strips HTML tags and dangerous characters.
 */
function sanitizeText(text: string): string {
    return text
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/[<>"']/g, '') // Remove dangerous chars
        .trim()
        .slice(0, 200); // Enforce max length
}
