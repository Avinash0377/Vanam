import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

async function getDashboardStats(request: NextRequest, user: JWTPayload) {
    try {

        // Get current date info — create separate instances to avoid mutation
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch stats in parallel
        const [
            totalProducts,
            totalOrders,
            pendingOrders,
            todayOrders,
            monthlyRevenueResult,
            totalRevenueResult,
            recentOrders,
            lowStockProducts,
        ] = await Promise.all([
            prisma.product.count(),
            prisma.order.count(),
            prisma.order.count({ where: { orderStatus: 'PENDING' } }),
            prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
            prisma.order.aggregate({
                where: {
                    orderStatus: { in: ['PAID', 'PACKING', 'SHIPPED', 'DELIVERED'] },
                    createdAt: { gte: startOfMonth }
                },
                _sum: { totalAmount: true }
            }),
            prisma.order.aggregate({
                where: { orderStatus: { in: ['PAID', 'PACKING', 'SHIPPED', 'DELIVERED'] } },
                _sum: { totalAmount: true }
            }),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, mobile: true } } }
            }),
            prisma.product.findMany({
                where: { stock: { lte: 5 } },
                select: { id: true, name: true, stock: true },
                orderBy: { stock: 'asc' },
                take: 10,
            }),
        ]);

        return NextResponse.json({
            stats: {
                totalProducts,
                totalOrders,
                pendingOrders,
                todayOrders,
                monthlyRevenue: monthlyRevenueResult._sum.totalAmount || 0,
                totalRevenue: totalRevenueResult._sum.totalAmount || 0,
            },
            recentOrders,
            lowStockProducts,
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getDashboardStats);
}
