import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { finalizePayment, markPendingPaymentFailed } from '@/lib/payment-finalize';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

// POST verify payment after checkout
async function verifyPayment(request: NextRequest, user: JWTPayload) {
    try {
        // Rate limit: 15 verify attempts per 15 minutes per user
        const rateLimitKey = `payment-verify:${user.userId}`;
        const rateCheck = checkRateLimit(rateLimitKey, { maxRequests: 15, windowSeconds: 15 * 60 });
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many verification attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = body;

        console.log('Payment Verification Request:', {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            hasSignature: !!razorpay_signature
        });

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error('Missing payment verification parameters');
            return NextResponse.json(
                { error: 'Missing payment verification parameters' },
                { status: 400 }
            );
        }

        // SECURITY: Verify signature using HMAC_SHA256(orderId|paymentId, secret)
        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            console.error('Invalid payment signature', {
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id
            });
            await markPendingPaymentFailed(razorpay_order_id, 'verify');
            return NextResponse.json(
                { error: 'Invalid payment signature' },
                { status: 400 }
            );
        }

        // Verify the payment belongs to this user
        const pendingPayment = await prisma.pendingPayment.findUnique({
            where: { razorpayOrderId: razorpay_order_id },
        });

        if (!pendingPayment) {
            return NextResponse.json(
                { error: 'Payment record not found' },
                { status: 404 }
            );
        }

        if (pendingPayment.userId !== user.userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Use shared finalization logic
        const result = await finalizePayment(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            'verify'
        );

        console.log('Finalize Payment Result:', result);

        if (!result.success) {
            console.error('Finalize Payment Failed:', result.error);
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.alreadyProcessed
                ? 'Payment already verified'
                : 'Payment verified successfully',
            orderNumber: result.orderNumber,
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAuth(request, verifyPayment);
}
