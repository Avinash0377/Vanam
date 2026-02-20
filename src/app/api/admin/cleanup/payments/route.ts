import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

async function cleanupPaymentsHandler(request: NextRequest, _user: JWTPayload) {
    // BUG-07 fix: require explicit confirmation to prevent accidental mass deletion
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');
    if (confirm !== 'yes') {
        return NextResponse.json(
            { error: 'Pass ?confirm=yes to execute cleanup', dryRun: true },
            { status: 400 }
        );
    }

    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Delete PENDING records older than 7 days (abandoned checkouts)
        const deletedPending = await prisma.pendingPayment.deleteMany({
            where: {
                status: 'PENDING',
                createdAt: { lt: sevenDaysAgo },
            },
        });

        // Delete FAILED records older than 30 days (enough time for disputes/investigations)
        const deletedFailed = await prisma.pendingPayment.deleteMany({
            where: {
                status: 'FAILED',
                updatedAt: { lt: thirtyDaysAgo },
            },
        });

        return NextResponse.json({
            message: 'Cleanup complete',
            deletedPending: deletedPending.count,
            deletedFailed: deletedFailed.count,
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return withAdmin(request, cleanupPaymentsHandler);
}
