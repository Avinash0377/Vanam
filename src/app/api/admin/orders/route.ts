import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// GET all orders for admin
async function getOrders(request: NextRequest, user: JWTPayload) {
    try {

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
        const status = searchParams.get('status') || '';
        const search = searchParams.get('search') || '';

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

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: { select: { name: true, mobile: true } },
                    items: { include: { product: { select: { name: true, images: true } } } },
                    payment: { select: { status: true, amount: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({
            orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
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
