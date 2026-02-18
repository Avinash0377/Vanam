import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { finalizePayment, markPendingPaymentFailed } from '@/lib/payment-finalize';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { logPaymentEvent } from '@/lib/payment-logger';

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

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { error: 'Missing payment verification parameters' },
                { status: 400 }
            );
        }

        // Log VERIFICATION_STARTED — fire-and-forget
        logPaymentEvent({
            eventType: 'VERIFICATION_STARTED',
            status: 'INFO',
            correlationId: razorpay_order_id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            message: 'Verification endpoint called',
            request,
        }).catch(() => null);

        // SECURITY: Verify signature using HMAC_SHA256(orderId|paymentId, secret)
        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            // Log SIGNATURE_FAILED — fire-and-forget
            logPaymentEvent({
                eventType: 'SIGNATURE_FAILED',
                status: 'FAILED',
                correlationId: razorpay_order_id,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                message: 'Razorpay signature validation failed — possible tampering',
                request,
            }).catch(() => null);

            await markPendingPaymentFailed(razorpay_order_id);
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

        // DUPLICATE ATTEMPT: Already processed — log once per 60s to prevent spam, then return
        if (pendingPayment.status === 'SUCCESS') {
            // Throttle: check if a DUPLICATE_ATTEMPT log was created in the last 60s
            const recentDuplicate = await prisma.paymentLog.findFirst({
                where: {
                    razorpayOrderId: razorpay_order_id,
                    eventType: 'DUPLICATE_ATTEMPT',
                    createdAt: { gte: new Date(Date.now() - 60_000) },
                },
            });

            if (!recentDuplicate) {
                logPaymentEvent({
                    eventType: 'DUPLICATE_ATTEMPT',
                    status: 'INFO',
                    correlationId: razorpay_order_id,
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    message: 'Verification attempted on already-processed payment',
                    request,
                }).catch(() => null);
            }

            // Find the existing order number and return success (idempotent)
            const existingPayment = await prisma.payment.findUnique({
                where: { razorpayOrderId: razorpay_order_id },
                include: { order: true },
            });

            return NextResponse.json({
                success: true,
                message: 'Payment already verified',
                orderNumber: existingPayment?.order?.orderNumber,
            });
        }

        // Use shared finalization logic
        const result = await finalizePayment(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            'verify'
        );

        if (!result.success) {
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

    } catch {
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAuth(request, verifyPayment);
}
