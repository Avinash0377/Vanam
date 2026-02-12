import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

async function getSalesAnalytics(request: NextRequest) {

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch all orders from the last 30 days (including cancelled for status distribution, but filtering for sales)
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                id: true,
                createdAt: true,
                totalAmount: true,
                orderStatus: true,
                paymentMethod: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // 1. Daily Sales Trend (Line/Bar Chart data)
        const salesByDate: Record<string, number> = {};
        const ordersByDate: Record<string, number> = {};

        // Initialize last 30 days with 0
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            salesByDate[dateString] = 0;
            ordersByDate[dateString] = 0;
        }

        orders.forEach(order => {
            if (order.orderStatus !== 'CANCELLED') {
                const dateString = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                // Note: If the initialized dates don't exactly match (e.g., varying formats), this simple key matching might miss.
                // Better approach: use YYYY-MM-DD for keys and map to display format later.
                // Re-doing date logic below for safety.
            }
        });

        // Robust Date Logic
        const dailyStats = new Map<string, { date: string; sales: number; orders: number }>();
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
            const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            dailyStats.set(key, { date: label, sales: 0, orders: 0 });
        }

        orders.forEach(order => {
            const key = new Date(order.createdAt).toISOString().split('T')[0];
            if (dailyStats.has(key)) {
                const stat = dailyStats.get(key)!;
                if (order.orderStatus !== 'CANCELLED') {
                    stat.sales += order.totalAmount;
                    stat.orders += 1;
                }
            }
        });

        const salesTrend = Array.from(dailyStats.values());

        // 2. Order Status Distribution (Donut Chart data)
        const statusDistribution: Record<string, number> = {};
        orders.forEach(order => {
            statusDistribution[order.orderStatus] = (statusDistribution[order.orderStatus] || 0) + 1;
        });

        const statusStats = Object.entries(statusDistribution).map(([name, value]) => ({ name, value }));

        // 3. Payment Method Distribution
        const paymentDistribution: Record<string, number> = {};
        orders.forEach(order => {
            paymentDistribution[order.paymentMethod] = (paymentDistribution[order.paymentMethod] || 0) + 1;
        });

        const paymentStats = Object.entries(paymentDistribution).map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            salesTrend,
            statusStats,
            paymentStats,
            totalSales30Days: salesTrend.reduce((acc, curr) => acc + curr.sales, 0),
            totalOrders30Days: salesTrend.reduce((acc, curr) => acc + curr.orders, 0)
        });

    } catch (error) {
        console.error('Sales analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sales analytics' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getSalesAnalytics);
}
