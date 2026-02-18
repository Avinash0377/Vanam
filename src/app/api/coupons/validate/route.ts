import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware';
import { normalizeCouponCode, validateCoupon } from '@/lib/coupon-utils';
import { getDeliverySettings, getDeliveryCharge } from '@/lib/order-utils';

// POST validate coupon (user-facing — works for both guests and logged-in users)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { couponCode, cartSubtotal } = body;

        const normalized = normalizeCouponCode(couponCode);
        if (!normalized) {
            return NextResponse.json({
                valid: false,
                discountAmount: 0,
                message: 'Please enter a valid coupon code',
            });
        }

        const subtotal = parseFloat(cartSubtotal);
        if (isNaN(subtotal) || subtotal <= 0) {
            return NextResponse.json({
                valid: false,
                discountAmount: 0,
                message: 'Invalid cart subtotal',
            });
        }

        // Optional auth — guests can validate coupons, per-user checks skipped if not logged in
        const user = getUserFromRequest(request);

        // Validate coupon (userId is optional — per-user limits checked only if logged in)
        const result = await validateCoupon({
            code: normalized,
            subtotal,
            userId: user?.userId,
        });

        // Fetch delivery settings to return delivery charge
        const deliverySettings = await getDeliverySettings();
        const deliveryCharge = getDeliveryCharge(subtotal, deliverySettings);

        // Calculate final total (never negative)
        const finalTotal = Math.max(0, subtotal - result.discountAmount + deliveryCharge);

        return NextResponse.json({
            valid: result.valid,
            discountAmount: result.discountAmount,
            deliveryCharge,
            finalTotal: Math.round(finalTotal * 100) / 100,
            message: result.message,
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        return NextResponse.json({
            valid: false,
            discountAmount: 0,
            message: 'Failed to validate coupon',
        }, { status: 500 });
    }
}
