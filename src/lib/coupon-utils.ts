/**
 * Coupon Validation & Calculation Utilities
 * 
 * All coupon logic is centralized here for consistency across:
 * - /api/coupons/validate (user-facing)
 * - /api/orders (order creation)
 * - payment-finalize.ts (payment finalization)
 */

import prisma from '@/lib/prisma';
import { Prisma, DiscountType } from '@prisma/client';
import { OrderError } from '@/lib/order-utils';

// ==================== TYPES ====================

export interface CouponValidationResult {
    valid: boolean;
    discountAmount: number;
    message: string;
    couponId?: string;
}

interface ValidateCouponParams {
    code: string;
    subtotal: number;
    userId?: string;
    /** Pass a transaction client for atomic operations */
    tx?: Prisma.TransactionClient;
    /** If true, skip start/expiry date check (coupon was valid at payment initiation time) */
    skipDateValidation?: boolean;
}

// ==================== NORMALIZATION ====================

/**
 * Normalize coupon code: trim, uppercase, reject non-alphanumeric.
 * Returns null if code is invalid.
 */
export function normalizeCouponCode(code: string | undefined | null): string | null {
    if (!code || typeof code !== 'string') return null;

    const cleaned = code.trim().toUpperCase();

    // Only allow alphanumeric and common characters (dash, underscore)
    if (!/^[A-Z0-9_-]+$/.test(cleaned) || cleaned.length === 0 || cleaned.length > 30) {
        return null;
    }

    return cleaned;
}

// ==================== VALIDATION ====================

/**
 * Full coupon validation with all business rule checks.
 * Can be used standalone or inside a transaction.
 */
export async function validateCoupon({
    code,
    subtotal,
    userId,
    tx,
    skipDateValidation = false,
}: ValidateCouponParams): Promise<CouponValidationResult> {
    const db = tx || prisma;

    // 1. Normalize code
    const normalized = normalizeCouponCode(code);
    if (!normalized) {
        return { valid: false, discountAmount: 0, message: 'Invalid coupon code format' };
    }

    // 2. Find coupon
    const coupon = await db.coupon.findUnique({ where: { code: normalized } });

    if (!coupon) {
        return { valid: false, discountAmount: 0, message: 'Coupon not found' };
    }

    // 3. Check active
    if (!coupon.isActive) {
        return { valid: false, discountAmount: 0, message: 'This coupon is no longer active' };
    }

    // 4. Check date validity (skip if coupon was valid at payment initiation)
    if (!skipDateValidation) {
        const now = new Date();
        if (now < coupon.startDate) {
            return { valid: false, discountAmount: 0, message: 'This coupon is not yet active' };
        }
        if (now > coupon.expiryDate) {
            return { valid: false, discountAmount: 0, message: 'This coupon has expired' };
        }
    }

    // 5. Check global usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, discountAmount: 0, message: 'This coupon has reached its usage limit' };
    }

    // 6. Check per-user usage limit (skip for guests — enforced at checkout)
    if (coupon.usagePerUser > 0 && userId) {
        // BUG-10 fix: count both committed orders AND in-flight pending payments
        // to prevent concurrent Razorpay flows from bypassing the per-user limit
        const [userUsageCount, pendingUsageCount] = await Promise.all([
            db.order.count({
                where: {
                    userId,
                    couponCode: normalized,
                    orderStatus: { notIn: ['CANCELLED', 'REFUNDED'] },
                },
            }),
            db.pendingPayment.count({
                where: {
                    userId,
                    couponCode: normalized,
                    status: 'PENDING',
                },
            }),
        ]);

        if (userUsageCount + pendingUsageCount >= coupon.usagePerUser) {
            return { valid: false, discountAmount: 0, message: 'You have already used this coupon' };
        }
    }

    // 7. Check minimum order value
    if (subtotal < coupon.minOrderValue) {
        return {
            valid: false,
            discountAmount: 0,
            message: `Minimum order value of ₹${coupon.minOrderValue} required`,
        };
    }

    // 8. Calculate discount
    const discountAmount = calculateDiscount(coupon.discountType, coupon.discountValue, subtotal, coupon.maxDiscountAmount);

    return {
        valid: true,
        discountAmount,
        message: `Coupon applied! You save ₹${discountAmount}`,
        couponId: coupon.id,
    };
}

// ==================== DISCOUNT CALCULATION ====================

/**
 * Calculate discount amount with safety guards.
 * Never returns negative, never exceeds subtotal.
 */
export function calculateDiscount(
    discountType: DiscountType,
    discountValue: number,
    subtotal: number,
    maxDiscountAmount: number | null,
): number {
    let discount = 0;

    if (discountType === 'PERCENTAGE') {
        discount = (subtotal * discountValue) / 100;
        // Cap at maxDiscountAmount if set
        if (maxDiscountAmount !== null && maxDiscountAmount > 0) {
            discount = Math.min(discount, maxDiscountAmount);
        }
    } else {
        // FIXED
        discount = discountValue;
    }

    // Never exceed subtotal, never negative
    discount = Math.max(0, Math.min(discount, subtotal));

    // Round to 2 decimal places
    return Math.round(discount * 100) / 100;
}

// ==================== ATOMIC USAGE MANAGEMENT ====================

/**
 * Atomically increment coupon usedCount inside a transaction.
 * Re-checks usageLimit to prevent race conditions.
 * MUST be called inside a Prisma $transaction.
 */
export async function atomicIncrementUsage(
    couponCode: string,
    tx: Prisma.TransactionClient,
): Promise<void> {
    const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });

    if (!coupon) return;

    // Re-check usage limit inside transaction (race condition protection)
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new OrderError('Coupon usage limit exceeded');
    }

    await tx.coupon.update({
        where: { code: couponCode },
        data: { usedCount: { increment: 1 } },
    });
}

/**
 * Decrement coupon usedCount on order cancellation/refund.
 * MUST be called inside a Prisma $transaction.
 */
export async function decrementCouponUsage(
    couponCode: string,
    tx: Prisma.TransactionClient,
): Promise<void> {
    const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });

    if (!coupon) return;

    // Only decrement if usedCount > 0
    if (coupon.usedCount > 0) {
        await tx.coupon.update({
            where: { code: couponCode },
            data: { usedCount: { decrement: 1 } },
        });
    }
}
