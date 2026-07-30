import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// GET all orders for admin
async function getOrders(request: NextRequest, _user: JWTPayload) {
    void _user;
    try {

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
        const status = searchParams.get('status') || '';
        const search = searchParams.get('search') || '';
        const paymentMethod = searchParams.get('paymentMethod') || '';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';
        const sort = searchParams.get('sort') || 'newest'; // newest | oldest | amount_desc | amount_asc

        const where: Record<string, unknown> = {};

        if (status) {
            where.orderStatus = status;
        }
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { mobile: { contains: search } },
            ];
        }
        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }
        if (startDate || endDate) {
            const range: Record<string, Date> = {};
            if (startDate) {
                const d = new Date(startDate);
                if (!isNaN(d.getTime())) {
                    d.setHours(0, 0, 0, 0);
                    range.gte = d;
                }
            }
            if (endDate) {
                const d = new Date(endDate);
                if (!isNaN(d.getTime())) {
                    d.setHours(23, 59, 59, 999);
                    range.lte = d;
                }
            }
            if (Object.keys(range).length) {
                where.createdAt = range;
            }
        }

        let orderBy: Record<string, 'asc' | 'desc'>;
        switch (sort) {
            case 'oldest': orderBy = { createdAt: 'asc' }; break;
            case 'amount_desc': orderBy = { totalAmount: 'desc' }; break;
            case 'amount_asc': orderBy = { totalAmount: 'asc' }; break;
            case 'newest':
            default: orderBy = { createdAt: 'desc' }; break;
        }

        const [orders, total, pendingCount, packingCount, shippedCount, deliveredCount] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: { select: { name: true, mobile: true } },
                    items: { include: { product: { select: { name: true, images: true } } } },
                    payment: { select: { status: true, amount: true } },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where }),
            prisma.order.count({ where: { orderStatus: 'PENDING' } }),
            prisma.order.count({ where: { orderStatus: 'PACKING' } }),
            prisma.order.count({ where: { orderStatus: 'SHIPPED' } }),
            prisma.order.count({ where: { orderStatus: 'DELIVERED' } }),
        ]);

        return NextResponse.json({
            orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            statusCounts: {
                PENDING: pendingCount,
                PACKING: packingCount,
                SHIPPED: shippedCount,
                DELIVERED: deliveredCount,
            },
        });

    } catch (error) {
        console.error('Admin orders error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getOrders);
}
