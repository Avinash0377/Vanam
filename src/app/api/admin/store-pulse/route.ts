import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

async function getStorePulse(request: NextRequest) {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            activeCartsCount,
            activeCarts,
            pendingOrdersCount,
            pendingOrders,
            todaySignups,
            todaySignupCount,
            recentWishlistCount,
            recentWishlistItems,
            todayOrdersCount,
            todayRevenue,
        ] = await Promise.all([
            // Active carts (updated within last hour)
            prisma.cart.groupBy({
                by: ['userId'],
                where: { updatedAt: { gte: oneHourAgo } },
            }).then(r => r.length),

            // Top active cart details (last hour, up to 5 users)
            prisma.cart.findMany({
                where: { updatedAt: { gte: oneHourAgo } },
                include: {
                    user: { select: { name: true, mobile: true } },
                    product: { select: { name: true, price: true, images: true } },
                    combo: { select: { name: true, price: true, images: true } },
                    hamper: { select: { name: true, price: true, images: true } },
                },
                orderBy: { updatedAt: 'desc' },
                take: 15,
            }),

            // Pending orders count
            prisma.order.count({
                where: { orderStatus: { in: ['PENDING', 'PAID', 'PACKING'] } },
            }),

            // Recent pending orders (up to 5)
            prisma.order.findMany({
                where: { orderStatus: { in: ['PENDING', 'PAID', 'PACKING'] } },
                include: { user: { select: { name: true, mobile: true } } },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),

            // Today's signups (up to 10)
            prisma.user.findMany({
                where: { createdAt: { gte: startOfToday } },
                select: { id: true, name: true, mobile: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),

            // Today's signup count
            prisma.user.count({
                where: { createdAt: { gte: startOfToday } },
            }),

            // Recent wishlist adds (24h)
            prisma.wishlist.count({
                where: { createdAt: { gte: twentyFourHoursAgo } },
            }),

            // Recent wishlist items with product details (up to 10)
            prisma.wishlist.findMany({
                where: { createdAt: { gte: twentyFourHoursAgo } },
                include: {
                    user: { select: { name: true } },
                    product: { select: { name: true, price: true } },
                    combo: { select: { name: true, price: true } },
                    hamper: { select: { name: true, price: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),

            // Today's orders count
            prisma.order.count({
                where: { createdAt: { gte: startOfToday } },
            }),

            // Today's revenue
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: startOfToday },
                    orderStatus: { in: ['PAID', 'PACKING', 'SHIPPED', 'DELIVERED'] },
                },
                _sum: { totalAmount: true },
            }),
        ]);

        // Group active carts by user
        const cartsByUser = new Map<string, {
            userName: string;
            userMobile: string;
            items: { name: string; price: number; quantity: number }[];
            lastActivity: Date;
        }>();

        for (const cart of activeCarts) {
            const userId = cart.userId;
            const itemName = cart.product?.name || cart.combo?.name || cart.hamper?.name || 'Unknown';
            const itemPrice = cart.product?.price || cart.combo?.price || cart.hamper?.price || 0;

            const existing = cartsByUser.get(userId);
            if (existing) {
                existing.items.push({ name: itemName, price: itemPrice, quantity: cart.quantity });
                if (cart.updatedAt > existing.lastActivity) {
                    existing.lastActivity = cart.updatedAt;
                }
            } else {
                cartsByUser.set(userId, {
                    userName: cart.user?.name || 'Guest',
                    userMobile: cart.user?.mobile || '',
                    items: [{ name: itemName, price: itemPrice, quantity: cart.quantity }],
                    lastActivity: cart.updatedAt,
                });
            }
        }

        const activeCartUsers = Array.from(cartsByUser.values())
            .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
            .slice(0, 5);

        // Format wishlist items
        const wishlistFormatted = recentWishlistItems.map(w => ({
            userName: w.user?.name || 'Unknown',
            itemName: w.product?.name || w.combo?.name || w.hamper?.name || 'Unknown',
            itemPrice: w.product?.price || w.combo?.price || w.hamper?.price || 0,
            addedAt: w.createdAt,
        }));

        // Format pending orders
        const pendingFormatted = pendingOrders.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName || o.user?.name,
            mobile: o.mobile || o.user?.mobile,
            total: o.totalAmount,
            status: o.orderStatus,
            createdAt: o.createdAt,
        }));

        return NextResponse.json({
            pulse: {
                activeCarts: {
                    count: activeCartsCount,
                    users: activeCartUsers,
                },
                actionNeeded: {
                    count: pendingOrdersCount,
                    orders: pendingFormatted,
                },
                todaySignups: {
                    count: todaySignupCount,
                    users: todaySignups,
                },
                wishlistActivity: {
                    count: recentWishlistCount,
                    items: wishlistFormatted,
                },
                todaySnapshot: {
                    orders: todayOrdersCount,
                    revenue: todayRevenue._sum.totalAmount || 0,
                },
            },
            generatedAt: now.toISOString(),
        });
    } catch (error) {
        console.error('Store pulse error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch store pulse' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getStorePulse);
}
