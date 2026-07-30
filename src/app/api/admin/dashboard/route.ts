import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// Order statuses that count as realised revenue
const PAID_STATUSES = [OrderStatus.PAID, OrderStatus.PACKING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

function startOfDayLocal(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKey(d: Date) {
    // yyyy-mm-dd in local time
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getDashboardStats(request: NextRequest, _user: JWTPayload) {
    void _user;
    try {
        const now = new Date();
        const startOfDay = startOfDayLocal(now);
        const startOfYesterday = new Date(startOfDay);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        // 30-day window (inclusive of today) for the sales chart
        const last30Start = new Date(startOfDay);
        last30Start.setDate(last30Start.getDate() - 29);

        const [
            totalProducts,
            outOfStockCount,
            totalOrders,
            pendingOrders,
            todayOrders,
            yesterdayOrders,
            monthlyRevenueResult,
            lastMonthRevenueResult,
            totalRevenueResult,
            recentOrders,
            lowStockProducts,
            seriesOrders,
            topItems,
            failedToday,
            signatureErrorsToday,
        ] = await Promise.all([
            prisma.product.count(),
            prisma.product.count({ where: { stock: 0 } }),
            prisma.order.count(),
            prisma.order.count({ where: { orderStatus: OrderStatus.PENDING } }),
            prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
            prisma.order.count({ where: { createdAt: { gte: startOfYesterday, lt: startOfDay } } }),
            prisma.order.aggregate({
                where: { orderStatus: { in: PAID_STATUSES }, createdAt: { gte: startOfMonth } },
                _sum: { totalAmount: true },
            }),
            prisma.order.aggregate({
                where: { orderStatus: { in: PAID_STATUSES }, createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
                _sum: { totalAmount: true },
            }),
            prisma.order.aggregate({
                where: { orderStatus: { in: PAID_STATUSES } },
                _sum: { totalAmount: true },
            }),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, mobile: true } } },
            }),
            prisma.product.findMany({
                where: { stock: { lte: 5 } },
                select: { id: true, name: true, stock: true },
                orderBy: { stock: 'asc' },
                take: 8,
            }),
            // Orders in the last 30 days for the revenue chart
            prisma.order.findMany({
                where: { orderStatus: { in: PAID_STATUSES }, createdAt: { gte: last30Start } },
                select: { createdAt: true, totalAmount: true },
            }),
            // Best sellers: line items across paid orders (aggregated in JS)
            prisma.orderItem.findMany({
                where: { productId: { not: null }, order: { orderStatus: { in: PAID_STATUSES } } },
                select: { productId: true, name: true, price: true, quantity: true, image: true },
            }),
            prisma.paymentLog.count({ where: { status: 'FAILED', createdAt: { gte: startOfDay } } }),
            prisma.paymentLog.count({ where: { eventType: 'SIGNATURE_FAILED', createdAt: { gte: startOfDay } } }),
        ]);

        // ---- Build 30-day revenue series (bucket in JS) ----
        const bucketOrder: string[] = [];
        const buckets = new Map<string, { revenue: number; orders: number }>();
        for (let i = 0; i < 30; i++) {
            const d = new Date(last30Start);
            d.setDate(d.getDate() + i);
            const key = dayKey(d);
            bucketOrder.push(key);
            buckets.set(key, { revenue: 0, orders: 0 });
        }
        for (const o of seriesOrders) {
            const key = dayKey(new Date(o.createdAt));
            const b = buckets.get(key);
            if (b) {
                b.revenue += o.totalAmount || 0;
                b.orders += 1;
            }
        }
        const revenueSeries = bucketOrder.map((date) => {
            const v = buckets.get(date)!;
            return { date, revenue: Math.round(v.revenue), orders: v.orders };
        });

        // ---- Best sellers aggregation ----
        const productAgg = new Map<string, { name: string; image: string | null; quantity: number; revenue: number }>();
        for (const item of topItems) {
            if (!item.productId) continue;
            const existing = productAgg.get(item.productId) ?? { name: item.name, image: item.image ?? null, quantity: 0, revenue: 0 };
            existing.quantity += item.quantity;
            existing.revenue += (item.price || 0) * item.quantity;
            if (!existing.image && item.image) existing.image = item.image;
            productAgg.set(item.productId, existing);
        }
        const topProducts = Array.from(productAgg.entries())
            .map(([id, v]) => ({ id, name: v.name, image: v.image, quantity: v.quantity, revenue: Math.round(v.revenue) }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // ---- Trend deltas (percent change vs previous period) ----
        const monthlyRevenue = monthlyRevenueResult._sum.totalAmount || 0;
        const lastMonthRevenue = lastMonthRevenueResult._sum.totalAmount || 0;

        const pct = (curr: number, prev: number): number | null => {
            if (prev === 0) return curr > 0 ? 100 : null;
            return Math.round(((curr - prev) / prev) * 100);
        };

        return NextResponse.json({
            stats: {
                totalProducts,
                outOfStockCount,
                totalOrders,
                pendingOrders,
                todayOrders,
                monthlyRevenue,
                totalRevenue: totalRevenueResult._sum.totalAmount || 0,
            },
            trends: {
                ordersTodayPct: pct(todayOrders, yesterdayOrders),
                monthlyRevenuePct: pct(monthlyRevenue, lastMonthRevenue),
                yesterdayOrders,
                lastMonthRevenue,
            },
            paymentHealth: {
                failedToday,
                signatureErrorsToday,
            },
            revenueSeries,
            topProducts,
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
