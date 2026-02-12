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
    const timestamp = new Date().toISOString();

    try {
        // 1. Read raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature) {
            console.log(`[webhook] ${timestamp} Missing signature`);
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        // 2. Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error(`[webhook] ${timestamp} RAZORPAY_WEBHOOK_SECRET not configured`);
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
            console.log(`[webhook] ${timestamp} Invalid signature`);
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
            console.log(`[webhook] ${timestamp} No payment entity in event: ${eventType}`);
            return NextResponse.json({ status: 'ignored' });
        }

        console.log(`[webhook] ${timestamp} Processing event: ${eventType}, order: ${payment.order_id}`);

        // 4. Handle events (ONLY payment.captured and payment.failed)
        switch (eventType) {
            case 'payment.captured':
                await handlePaymentCaptured(payment, timestamp);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payment, timestamp);
                break;

            default:
                console.log(`[webhook] ${timestamp} Ignoring event: ${eventType}`);
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error(`[webhook] ${timestamp} Error:`, error);
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
    timestamp: string
) {
    const { id: paymentId, order_id: razorpayOrderId, amount } = payment;

    console.log(`[webhook] ${timestamp} payment.captured: ${razorpayOrderId}, amount: ${amount}`);

    // Check if PendingPayment exists
    const pendingPayment = await prisma.pendingPayment.findUnique({
        where: { razorpayOrderId },
    });

    if (!pendingPayment) {
        console.log(`[webhook] ${timestamp} PendingPayment not found: ${razorpayOrderId}`);
        return;
    }

    // Validate amount matches (convert paise to rupees)
    const expectedAmountPaise = Math.round(pendingPayment.amount * 100);
    if (amount !== expectedAmountPaise) {
        console.error(`[webhook] ${timestamp} Amount mismatch! Expected: ${expectedAmountPaise}, Got: ${amount}`);
        await markPendingPaymentFailed(razorpayOrderId, 'webhook');
        return;
    }

    // Use shared finalization logic (handles idempotency)
    const result = await finalizePayment(
        razorpayOrderId,
        paymentId,
        null, // Webhook doesn't have signature
        'webhook'
    );

    if (result.success) {
        console.log(`[webhook] ${timestamp} Order ${result.alreadyProcessed ? 'already exists' : 'created'}: ${result.orderNumber}`);
    } else {
        console.error(`[webhook] ${timestamp} Finalization failed: ${result.error}`);
    }
}

/**
 * Handle payment.failed event
 * Marks the pending payment as failed
 */
async function handlePaymentFailed(
    payment: RazorpayPaymentEntity,
    timestamp: string
) {
    const { order_id: razorpayOrderId, error_code, error_description } = payment;

    console.log(`[webhook] ${timestamp} payment.failed: ${razorpayOrderId}, error: ${error_code} - ${error_description}`);

    // Check if PendingPayment exists
    const pendingPayment = await prisma.pendingPayment.findUnique({
        where: { razorpayOrderId },
    });

    if (!pendingPayment) {
        console.log(`[webhook] ${timestamp} PendingPayment not found: ${razorpayOrderId}`);
        return;
    }

    // Only mark as failed if still PENDING
    if (pendingPayment.status === 'PENDING') {
        await markPendingPaymentFailed(razorpayOrderId, 'webhook');
        console.log(`[webhook] ${timestamp} Marked as FAILED: ${razorpayOrderId}`);
    } else {
        console.log(`[webhook] ${timestamp} Already processed (${pendingPayment.status}): ${razorpayOrderId}`);
    }
}
