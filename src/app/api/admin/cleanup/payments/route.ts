/**
 * POST /api/admin/cleanup/payments
 *
 * Cleans up stale payment data:
 * 1. Expired PendingPayments (PENDING status + past expiresAt) → marked FAILED
 * 2. Old PaymentLogs beyond retention period → deleted
 *
 * SECURITY: Admin-only endpoint.
 * SAFETY: Only touches expired/old records — never active payments.
 *
 * Can be called manually from admin panel or via external cron (e.g., cron-job.org).
 * Recommended: Run daily.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// Retention: keep PaymentLogs for 90 days, then delete
const PAYMENT_LOG_RETENTION_DAYS = 90;

// PendingPayments older than 24 hours with PENDING/FAILED status can be deleted
const PENDING_PAYMENT_STALE_HOURS = 24;

async function cleanupPayments(request: NextRequest, _user: JWTPayload) {
    try {
        const now = new Date();
        const results = {
            expiredPendingMarkedFailed: 0,
            stalePendingDeleted: 0,
            oldLogsDeleted: 0,
        };

        // 1. Mark expired PENDING payments as FAILED
        // These are payment sessions where the user never completed payment
        // and the 30-min window has passed
        const expiredResult = await prisma.pendingPayment.updateMany({
            where: {
                status: 'PENDING',
                expiresAt: { lt: now },
            },
            data: { status: 'FAILED' },
        });
        results.expiredPendingMarkedFailed = expiredResult.count;

        // 2. Delete stale PendingPayments (FAILED status, older than 24 hours)
        // These are fully resolved — either expired, failed, or already converted to orders.
        // The corresponding Order + Payment records have all the data we need.
        const staleDate = new Date(now.getTime() - PENDING_PAYMENT_STALE_HOURS * 60 * 60 * 1000);
        const deleteStaleResult = await prisma.pendingPayment.deleteMany({
            where: {
                status: { in: ['FAILED', 'SUCCESS'] },
                updatedAt: { lt: staleDate },
            },
        });
        results.stalePendingDeleted = deleteStaleResult.count;

        // 3. Delete old PaymentLogs beyond retention period
        // Keeps the last 90 days for auditing, deletes older entries
        const retentionDate = new Date(now.getTime() - PAYMENT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
        const deleteLogsResult = await prisma.paymentLog.deleteMany({
            where: {
                createdAt: { lt: retentionDate },
            },
        });
        results.oldLogsDeleted = deleteLogsResult.count;

        return NextResponse.json({
            message: 'Payment cleanup completed',
            results,
            retentionPolicy: {
                paymentLogRetentionDays: PAYMENT_LOG_RETENTION_DAYS,
                pendingPaymentStaleHours: PENDING_PAYMENT_STALE_HOURS,
            },
            cleanedAt: now.toISOString(),
        });

    } catch (error) {
        console.error('Payment cleanup error:', error);
        return NextResponse.json(
            { error: 'Cleanup failed' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAdmin(request, cleanupPayments);
}
