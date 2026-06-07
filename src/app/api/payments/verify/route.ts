import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { verifyPaymentSignature, fetchPayment } from '@/lib/razorpay';
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

        // SECURITY: Re-validate amount against Razorpay's actual payment record.
        // This prevents scenarios where a tampered payment of ₹1 could create a ₹10,000 order.
        // The webhook handler already does this — now the /verify endpoint does too.
        try {
            const razorpayPayment = await fetchPayment(razorpay_payment_id);
            const expectedAmountPaise = Math.round(pendingPayment.amount * 100);
            const actualAmountPaise = razorpayPayment.amount as number;

            if (actualAmountPaise !== expectedAmountPaise) {
                logPaymentEvent({
                    eventType: 'FAILED',
                    status: 'FAILED',
                    correlationId: razorpay_order_id,
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    amount: actualAmountPaise / 100,
                    message: `Amount mismatch in /verify: expected ${expectedAmountPaise} paise, got ${actualAmountPaise} paise`,
                    request,
                }).catch(() => null);

                await markPendingPaymentFailed(razorpay_order_id);
                return NextResponse.json(
                    { error: 'Payment amount mismatch. Please contact support.' },
                    { status: 400 }
                );
            }
        } catch (fetchError) {
            // If Razorpay API is unreachable, log but don't block — signature was already verified
            logPaymentEvent({
                eventType: 'VERIFICATION_STARTED',
                status: 'INFO',
                correlationId: razorpay_order_id,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                message: `Razorpay fetchPayment failed (non-blocking): ${fetchError instanceof Error ? fetchError.message : 'Unknown'}`,
                request,
            }).catch(() => null);
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
                { status: result.error === 'Payment record not found' ? 404 : 409 }
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
