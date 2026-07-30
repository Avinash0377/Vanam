import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

/**
 * GET /api/admin/customers/history?mobile=<mobile>&excludeOrderId=<id>
 * Returns lifetime order count + spend for a customer identified by mobile number.
 *
 * - `totalOrders`   = every order ever placed by this mobile (any status)
 * - `paidOrders`    = orders excluding CANCELLED / REFUNDED
 * - `lifetimeValue` = sum(totalAmount) over paidOrders — reflects real revenue
 * - `previousOrders`/`previousValue` — same metrics excluding the current order (so the UI can say "this is order #3, previously ordered 2× for ₹X")
 * - `lastOrder`     = most recent OTHER order (excluding the current one) if any
 */
async function getCustomerHistory(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rawMobile = (searchParams.get('mobile') || '').trim();
        const excludeOrderId = searchParams.get('excludeOrderId') || undefined;

        if (!rawMobile) {
            return NextResponse.json({ error: 'mobile is required' }, { status: 400 });
        }

        // Normalise: match on last 10 digits so records stored as +91XXXXXXXXXX / 91XXXXXXXXXX / XXXXXXXXXX all match.
        const digits = rawMobile.replace(/\D/g, '');
        const last10 = digits.slice(-10);
        const mobileFilter = last10
            ? { mobile: { contains: last10 } }
            : { mobile: rawMobile };

        const baseWhere: Record<string, unknown> = { ...mobileFilter };
        const notCancelled = { orderStatus: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } };

        const excludeCurrent = excludeOrderId ? { id: { not: excludeOrderId } } : {};

        const [totalOrders, paidOrders, paidAggregate, previousOrders, previousAggregate, lastOrder] = await Promise.all([
            // All orders (any status) — includes current
            prisma.order.count({ where: baseWhere }),
            // Non-cancelled/refunded — includes current
            prisma.order.count({ where: { ...baseWhere, ...notCancelled } }),
            prisma.order.aggregate({
                where: { ...baseWhere, ...notCancelled },
                _sum: { totalAmount: true },
            }),
            // Excluding current order — for "prior" counts
            prisma.order.count({ where: { ...baseWhere, ...excludeCurrent } }),
            prisma.order.aggregate({
                where: { ...baseWhere, ...notCancelled, ...excludeCurrent },
                _sum: { totalAmount: true },
            }),
            // Most recent OTHER order (excluding current)
            prisma.order.findFirst({
                where: { ...baseWhere, ...excludeCurrent },
                orderBy: { createdAt: 'desc' },
                select: { id: true, orderNumber: true, createdAt: true, orderStatus: true, totalAmount: true },
            }),
        ]);

        return NextResponse.json({
            totalOrders,
            paidOrders,
            lifetimeValue: paidAggregate._sum.totalAmount || 0,
            previousOrders,
            previousValue: previousAggregate._sum.totalAmount || 0,
            lastOrder,
        });
    } catch (error) {
        console.error('Customer history error:', error);
        return NextResponse.json({ error: 'Failed to fetch customer history' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getCustomerHistory);
}
