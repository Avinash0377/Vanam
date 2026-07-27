import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { normalizeCouponCode } from '@/lib/coupon-utils';
import { invalidateOffersCache } from '@/lib/coupon-eligibility';

// GET all coupons (with filtering, search, pagination)
async function getCoupons(request: NextRequest, _user: JWTPayload) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
        const search = searchParams.get('search')?.trim().toUpperCase() || '';
        const filterActive = searchParams.get('active'); // 'true', 'false', or null

        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (search) {
            where.code = { contains: search, mode: 'insensitive' };
        }

        if (filterActive === 'true') {
            where.isActive = true;
        } else if (filterActive === 'false') {
            where.isActive = false;
        }

        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.coupon.count({ where }),
        ]);

        return NextResponse.json({
            coupons,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get coupons error:', error);
        return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
    }
}

// POST create coupon
async function createCoupon(request: NextRequest, _user: JWTPayload) {
    try {
        const body = await request.json();

        // PDP offer fields
        const autoApply = Boolean(body.autoApply);
        const showOnProductPage = Boolean(body.showOnProductPage);

        // Code validation: required unless autoApply
        let code: string | null = null;
        if (autoApply) {
            // Auto-apply coupons still need a unique internal code for tracking
            code = body.code ? normalizeCouponCode(body.code) : `AUTO_${Date.now()}`;
        } else {
            code = normalizeCouponCode(body.code);
            if (!code) {
                return NextResponse.json({ error: 'Invalid coupon code. Use only letters, numbers, dashes, underscores.' }, { status: 400 });
            }
        }

        if (!code) {
            return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
        }

        // Validation
        const { discountType, discountValue, minOrderValue = 0, maxDiscountAmount, usageLimit, usagePerUser = 1, applicableTo = 'ALL', applicableIds = [], isActive = true, description, startDate, expiryDate } = body;

        if (!discountType || !['PERCENTAGE', 'FIXED'].includes(discountType)) {
            return NextResponse.json({ error: 'discountType must be PERCENTAGE or FIXED' }, { status: 400 });
        }

        if (!discountValue || discountValue <= 0) {
            return NextResponse.json({ error: 'discountValue must be greater than 0' }, { status: 400 });
        }

        if (discountType === 'PERCENTAGE' && discountValue > 100) {
            return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 });
        }

        if (!startDate || !expiryDate) {
            return NextResponse.json({ error: 'startDate and expiryDate are required' }, { status: 400 });
        }

        const start = new Date(startDate);
        const expiry = new Date(expiryDate);

        if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
        }

        if (expiry <= start) {
            return NextResponse.json({ error: 'Expiry date must be after start date' }, { status: 400 });
        }

        // Validate new PDP offer fields
        const offerType = body.offerType || 'PERCENTAGE';
        if (!['PERCENTAGE', 'FLAT', 'FREE_SHIPPING', 'BOGO'].includes(offerType)) {
            return NextResponse.json({ error: 'Invalid offer type' }, { status: 400 });
        }

        const applicabilityScope = body.applicabilityScope || 'ALL_PRODUCTS';
        if (!['ALL_PRODUCTS', 'CATEGORY', 'PRODUCT', 'COLLECTION_TAG'].includes(applicabilityScope)) {
            return NextResponse.json({ error: 'Invalid applicability scope' }, { status: 400 });
        }

        // Validate scope-specific arrays
        const includedProductIds = Array.isArray(body.includedProductIds) ? body.includedProductIds : [];
        const excludedProductIds = Array.isArray(body.excludedProductIds) ? body.excludedProductIds : [];
        const includedCategoryIds = Array.isArray(body.includedCategoryIds) ? body.includedCategoryIds : [];
        const includedTags = Array.isArray(body.includedTags) ? body.includedTags : [];

        if (applicabilityScope === 'PRODUCT' && includedProductIds.length === 0) {
            return NextResponse.json({ error: 'Select at least one product when targeting specific products' }, { status: 400 });
        }
        if (applicabilityScope === 'CATEGORY' && includedCategoryIds.length === 0) {
            return NextResponse.json({ error: 'Select at least one category when targeting specific categories' }, { status: 400 });
        }
        if (applicabilityScope === 'COLLECTION_TAG' && includedTags.length === 0) {
            return NextResponse.json({ error: 'Enter at least one tag when targeting by tags' }, { status: 400 });
        }

        // Validate displayTitle length
        if (body.displayTitle && body.displayTitle.length > 90) {
            return NextResponse.json({ error: 'Display title must be 90 characters or less' }, { status: 400 });
        }
        if (body.displaySubtext && body.displaySubtext.length > 120) {
            return NextResponse.json({ error: 'Display subtext must be 120 characters or less' }, { status: 400 });
        }

        // Check uniqueness
        const existing = await prisma.coupon.findUnique({ where: { code } });
        if (existing) {
            return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 400 });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code,
                description: description || null,
                discountType,
                discountValue: parseFloat(discountValue),
                minOrderValue: parseFloat(minOrderValue) || 0,
                maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                usagePerUser: parseInt(usagePerUser) || 1,
                applicableTo,
                applicableIds: Array.isArray(applicableIds) ? applicableIds : [],
                isActive: Boolean(isActive),
                startDate: start,
                expiryDate: expiry,
                // PDP Offer fields
                offerType,
                showOnProductPage,
                autoApply,
                displayTitle: body.displayTitle || null,
                displaySubtext: body.displaySubtext || null,
                sortOrder: parseInt(body.sortOrder) || 0,
                applicabilityScope,
                includedProductIds,
                excludedProductIds,
                includedCategoryIds,
                includedTags,
                stackable: Boolean(body.stackable),
                perUserLimit: body.perUserLimit ? parseInt(body.perUserLimit) : null,
            },
        });

        // Invalidate PDP offers cache
        invalidateOffersCache();

        return NextResponse.json({ coupon, message: 'Coupon created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Create coupon error:', error);
        return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getCoupons);
}

export async function POST(request: NextRequest) {
    return withAdmin(request, createCoupon);
}
