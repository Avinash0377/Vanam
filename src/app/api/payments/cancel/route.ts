/**
 * POST /api/payments/cancel
 *
 * Called by the frontend when the user closes the Razorpay modal without paying.
 *
 * STATE VALIDATION: Only logs CANCELED if PendingPayment is still PENDING.
 * If a success webhook already arrived, we do NOT log CANCELED — this prevents
 * misleading audit trails where a payment appears canceled after being successful.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logPaymentEvent } from '@/lib/payment-logger';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

async function cancelPayment(request: NextRequest, user: JWTPayload) {
    try {
        // Rate limit: 10 cancellations per minute per IP (prevents log-flooding / DB hammering)
        const ip = getClientIp(request);
        const rl = checkRateLimit(`payment-cancel:${ip}`, { maxRequests: 10, windowSeconds: 60 });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            );
        }

        const body = await request.json();
        const { razorpayOrderId } = body;

        if (!razorpayOrderId || typeof razorpayOrderId !== 'string') {
            return NextResponse.json(
                { error: 'razorpayOrderId is required' },
                { status: 400 }
            );
        }

        // Find the pending payment — must belong to this user
        const pendingPayment = await prisma.pendingPayment.findUnique({
            where: { razorpayOrderId },
        });

        if (!pendingPayment) {
            return NextResponse.json({ ok: true }); // Silently ignore — may have been cleaned up
        }

        if (pendingPayment.userId !== user.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // STATE VALIDATION: Only log CANCELED if payment is still PENDING.
        // If SUCCESS webhook already arrived, do NOT log CANCELED.
        if (pendingPayment.status !== 'PENDING') {
            return NextResponse.json({ ok: true, skipped: true });
        }

        // Log the cancellation — fire-and-forget
        logPaymentEvent({
            eventType: 'CANCELED',
            status: 'FAILED',
            correlationId: razorpayOrderId,
            pendingPaymentId: pendingPayment.id,
            razorpayOrderId,
            amount: pendingPayment.amount,
            message: 'User closed payment modal',
            request,
        }).catch(() => null);

        return NextResponse.json({ ok: true });

    } catch {
        return NextResponse.json(
            { error: 'Failed to log cancellation' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAuth(request, cancelPayment);
}
