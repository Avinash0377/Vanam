import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

// GET /api/admin/users/[id] - User detail with order history
async function getUserDetail(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // Fetch user with orders
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                orders: {
                    select: {
                        id: true,
                        orderNumber: true,
                        totalAmount: true,
                        orderStatus: true,
                        paymentMethod: true,
                        createdAt: true,
                        items: {
                            select: {
                                name: true,
                                quantity: true,
                                price: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Compute stats
        const orderCount = user.orders.length;
        const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
        const lastOrderDate = user.orders.length > 0 ? user.orders[0].createdAt : null;

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt,
            },
            stats: {
                orderCount,
                totalSpent,
                averageOrderValue,
                lastOrderDate,
            },
            orders: user.orders,
        });

    } catch (error) {
        console.error('Get user detail error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAdmin(request, (req) => getUserDetail(req, context));
}
