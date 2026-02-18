/**
 * Razorpay Webhook Handler
 *
 * BACKUP PAYMENT CONFIRMATION SYSTEM
 *
 * This webhook ensures payment is finalized even if:
 * - User closes the browser before verification
 * - Network issues prevent frontend verification
 * - Any other frontend failure
 *
 * SECURITY:
 * - Verifies webhook signature using RAZORPAY_WEBHOOK_SECRET
 * - Uses raw body for signature verification
 * - Never trusts frontend data
 *
 * IDEMPOTENCY:
 * - Uses shared finalizePayment() function
 * - Never creates duplicate orders
 * - Safe for Razorpay retries
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { finalizePayment, markPendingPaymentFailed } from '@/lib/payment-finalize';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logPaymentEvent } from '@/lib/payment-logger';

// Disable body parsing - we need raw body for signature verification
export const dynamic = 'force-dynamic';

interface RazorpayPaymentEntity {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    error_code?: string;
    error_description?: string;
}

interface RazorpayWebhookEvent {
    event: string;
    payload: {
        payment: {
            entity: RazorpayPaymentEntity;
        };
    };
}

export async function POST(request: NextRequest) {
    try {
        // 0. IP-based rate limit: 200 requests/min (Razorpay retries are ~5/event max)
        const ip = getClientIp(request);
        const rateCheck = checkRateLimit(`webhook:${ip}`, { maxRequests: 200, windowSeconds: 60 });
        if (!rateCheck.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // 1. Read raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        // 2. Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            return NextResponse.json(
                { error: 'Webhook not configured' },
                { status: 500 }
            );
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        // 3. Parse event
        const event: RazorpayWebhookEvent = JSON.parse(rawBody);
        const eventType = event.event;
        const payment = event.payload?.payment?.entity;

        if (!payment) {
            return NextResponse.json({ status: 'ignored' });
        }

        // 4. Handle events
        // NOTE: UPI payments fire 'payment.authorized' (NOT 'payment.captured')
        // Card/netbanking payments fire 'payment.captured'
        // We handle BOTH to ensure orders are created for all payment methods
        switch (eventType) {
            case 'payment.captured':
            case 'payment.authorized':
                await handlePaymentCaptured(payment, request);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payment, request);
                break;

            default:
                // Silently ignore other events
                break;
        }

        return NextResponse.json({ status: 'ok' });

    } catch {
        // Return 200 to prevent Razorpay retries on server errors
        return NextResponse.json({ status: 'error', message: 'Internal error' });
    }
}

/**
 * Handle payment.captured event
 * This creates the order if not already created by /verify
 */
async function handlePaymentCaptured(
    payment: RazorpayPaymentEntity,
    request: NextRequest
) {
    const { id: paymentId, order_id: razorpayOrderId, amount } = payment;

    // Log WEBHOOK_RECEIVED — sanitized payload, fire-and-forget
    logPaymentEvent({
        eventType: 'WEBHOOK_RECEIVED',
        status: 'INFO',
        correlationId: razorpayOrderId,
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        amount: amount / 100, // Convert paise to rupees for log
        message: 'payment.captured webhook received',
        rawPayload: {
            event: 'payment.captured',
            paymentId,
            razorpayOrderId,
            amount,
            currency: payment.currency,
            method: payment.method,
        },
        request,
    }).catch(() => null);

    // Check if PendingPayment exists
    const pendingPayment = await prisma.pendingPayment.findUnique({
        where: { razorpayOrderId },
    });

    if (!pendingPayment) {
        return;
    }

    // Validate amount matches (convert paise to rupees)
    const expectedAmountPaise = Math.round(pendingPayment.amount * 100);
    if (amount !== expectedAmountPaise) {
        logPaymentEvent({
            eventType: 'FAILED',
            status: 'FAILED',
            correlationId: razorpayOrderId,
            razorpayOrderId,
            razorpayPaymentId: paymentId,
            amount: amount / 100,
            message: `Amount mismatch: expected ${expectedAmountPaise} paise, got ${amount} paise`,
        }).catch(() => null);

        await markPendingPaymentFailed(razorpayOrderId);
        return;
    }

    // Use shared finalization logic (handles idempotency)
    const result = await finalizePayment(
        razorpayOrderId,
        paymentId,
        null, // Webhook doesn't have signature
        'webhook'
    );

    if (result.success && !result.alreadyProcessed) {
        // Log WEBHOOK_CONFIRMED — fire-and-forget
        logPaymentEvent({
            eventType: 'WEBHOOK_CONFIRMED',
            status: 'SUCCESS',
            correlationId: razorpayOrderId,
            razorpayOrderId,
            razorpayPaymentId: paymentId,
            amount: amount / 100,
            message: `Order ${result.orderNumber} confirmed via webhook`,
        }).catch(() => null);
    }
}

/**
 * Handle payment.failed event
 * Marks the pending payment as failed
 */
async function handlePaymentFailed(
    payment: RazorpayPaymentEntity,
    request: NextRequest
) {
    const { id: paymentId, order_id: razorpayOrderId, error_code, error_description } = payment;

    // Log WEBHOOK_RECEIVED first — fire-and-forget
    logPaymentEvent({
        eventType: 'WEBHOOK_RECEIVED',
        status: 'INFO',
        correlationId: razorpayOrderId,
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        message: 'payment.failed webhook received',
        rawPayload: {
            event: 'payment.failed',
            paymentId,
            razorpayOrderId,
            error_code,
            error_description,
        },
        request,
    }).catch(() => null);

    // Check if PendingPayment exists
    const pendingPayment = await prisma.pendingPayment.findUnique({
        where: { razorpayOrderId },
    });

    if (!pendingPayment) {
        return;
    }

    // Only mark as failed if still PENDING
    if (pendingPayment.status === 'PENDING') {
        await markPendingPaymentFailed(razorpayOrderId);

        // Log FAILED — fire-and-forget
        logPaymentEvent({
            eventType: 'FAILED',
            status: 'FAILED',
            correlationId: razorpayOrderId,
            pendingPaymentId: pendingPayment.id,
            razorpayOrderId,
            razorpayPaymentId: paymentId,
            amount: pendingPayment.amount,
            message: `Payment failed: ${error_code ?? 'unknown'} — ${error_description ?? ''}`.trim(),
        }).catch(() => null);
    }
}
