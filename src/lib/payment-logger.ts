/**
 * Payment Logger — Append-Only Audit Trail
 *
 * RULES:
 * - INSERT ONLY. Never update or delete PaymentLog records.
 * - Fire-and-forget. Callers must use .catch(() => null) — logging must never block payment flow.
 * - Sanitized payload. Strips sensitive keys before storing.
 * - Size-controlled payload. Max 2 levels deep, strings truncated at 500 chars.
 * - correlationId = razorpayOrderId (groups all events for one payment attempt).
 */

import prisma from '@/lib/prisma';
import { PaymentEventType, PaymentLogStatus, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

export type { PaymentEventType, PaymentLogStatus };

export interface LogPaymentEventParams {
    eventType: PaymentEventType;
    status: PaymentLogStatus;
    correlationId?: string;       // Use razorpayOrderId
    orderId?: string;
    pendingPaymentId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    amount?: number;
    message?: string;
    rawPayload?: Record<string, unknown>;
    request?: NextRequest;        // For IP + UserAgent extraction
}

// Keys that must never be stored in logs
const SENSITIVE_KEY_PATTERN = /secret|key|password|token|signature|cvv|card|pan|otp/i;

/**
 * Sanitize and size-control a payload before storing.
 * - Strips sensitive keys
 * - Max 2 levels deep
 * - Strings truncated at 500 chars
 * - Arrays truncated at 10 items
 */
function sanitizePayload(
    payload: unknown,
    depth = 0
): unknown {
    if (depth > 2) return '[truncated]';
    if (payload === null || payload === undefined) return payload;

    if (typeof payload === 'string') {
        return payload.length > 500 ? payload.slice(0, 500) + '…' : payload;
    }

    if (typeof payload !== 'object') return payload;

    if (Array.isArray(payload)) {
        const truncated = payload.slice(0, 10);
        return truncated.map(item => sanitizePayload(item, depth + 1));
    }

    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
        if (SENSITIVE_KEY_PATTERN.test(k)) continue;
        result[k] = sanitizePayload(v, depth + 1);
    }
    return result;
}

/**
 * Extract client IP from request headers (handles proxies).
 */
function extractIp(request: NextRequest): string | undefined {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') ?? undefined;
}

/**
 * Extract User-Agent from request headers.
 */
function extractUserAgent(request: NextRequest): string | undefined {
    return request.headers.get('user-agent') ?? undefined;
}

/**
 * Insert a single PaymentLog record.
 *
 * IMPORTANT: This function is append-only. It never updates or deletes records.
 * Callers MUST use: logPaymentEvent(...).catch(() => null)
 */
export async function logPaymentEvent(params: LogPaymentEventParams): Promise<void> {
    const {
        eventType,
        status,
        correlationId,
        orderId,
        pendingPaymentId,
        razorpayOrderId,
        razorpayPaymentId,
        amount,
        message,
        rawPayload,
        request,
    } = params;

    const sanitized = rawPayload
        ? (sanitizePayload(rawPayload) as Record<string, unknown>)
        : undefined;

    const ipAddress = request ? extractIp(request) : undefined;
    const userAgent = request ? extractUserAgent(request) : undefined;

    await prisma.paymentLog.create({
        data: {
            eventType,
            status,
            correlationId: correlationId ?? razorpayOrderId,
            orderId: orderId ?? null,
            pendingPaymentId: pendingPaymentId ?? null,
            razorpayOrderId: razorpayOrderId ?? null,
            razorpayPaymentId: razorpayPaymentId ?? null,
            amount: amount ?? null,
            message: message ?? null,
            rawPayload: sanitized !== undefined ? (sanitized as Prisma.InputJsonValue) : undefined,
            ipAddress: ipAddress ?? null,
            userAgent: userAgent ?? null,
        },
    });
}
