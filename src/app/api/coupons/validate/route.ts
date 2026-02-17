import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { normalizeCouponCode, validateCoupon } from '@/lib/coupon-utils';
import { getDeliverySettings, getDeliveryCharge } from '@/lib/order-utils';

// POST validate coupon (user-facing)
async function validateCouponHandler(request: NextRequest, user: JWTPayload) {
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

        // Validate coupon
        const result = await validateCoupon({
            code: normalized,
            subtotal,
            userId: user.userId,
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

export async function POST(request: NextRequest) {
    return withAuth(request, validateCouponHandler);
}
