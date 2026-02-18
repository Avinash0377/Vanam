import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PaymentEventType, PaymentLogStatus } from '@prisma/client';

// GET /api/admin/payment-logs
// Paginated, filtered, read-only. Protected by withAdmin.
async function getPaymentLogs(request: NextRequest, _user: JWTPayload) {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
    const skip = (page - 1) * limit;

    const orderId = searchParams.get('orderId') ?? undefined;
    const razorpayOrderId = searchParams.get('razorpayOrderId') ?? undefined;
    const correlationId = searchParams.get('correlationId') ?? undefined;
    const eventType = searchParams.get('eventType') as PaymentEventType | null;
    const status = searchParams.get('status') as PaymentLogStatus | null;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build where clause — typed as object since MongoDB Prisma doesn't expose PaymentLogWhereInput
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (orderId) where.orderId = { contains: orderId };
    if (razorpayOrderId) where.razorpayOrderId = { contains: razorpayOrderId };
    if (correlationId) where.correlationId = { contains: correlationId };
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;

    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) {
            // Include the full "to" day
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            where.createdAt.lte = toDate;
        }
    }

    const [logs, total] = await Promise.all([
        prisma.paymentLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
                id: true,
                correlationId: true,
                orderId: true,
                razorpayOrderId: true,
                razorpayPaymentId: true,
                eventType: true,
                status: true,
                amount: true,
                message: true,
                ipAddress: true,
                createdAt: true,
                // Omit rawPayload and userAgent from list view for performance
            },
        }),
        prisma.paymentLog.count({ where }),
    ]);

    return NextResponse.json({
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getPaymentLogs);
}

// Explicitly block all mutating methods
export async function POST() {
    return NextResponse.json({ error: 'Payment logs are read-only' }, { status: 405 });
}
export async function PUT() {
    return NextResponse.json({ error: 'Payment logs are read-only' }, { status: 405 });
}
export async function DELETE() {
    return NextResponse.json({ error: 'Payment logs are read-only' }, { status: 405 });
}
export async function PATCH() {
    return NextResponse.json({ error: 'Payment logs are read-only' }, { status: 405 });
}
