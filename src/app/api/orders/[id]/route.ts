import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { restoreStock } from '@/lib/order-utils';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single order
async function getOrder(
    request: NextRequest,
    user: JWTPayload,
    id: string
) {
    try {
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { id },
                    { orderNumber: id },
                ],
                // Non-admin users can only see their own orders
                ...(user.role !== 'ADMIN' && { userId: user.userId }),
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, slug: true, images: true }
                        },
                        combo: {
                            select: { id: true, name: true, slug: true, images: true }
                        },
                        hamper: {
                            select: { id: true, name: true, slug: true, images: true }
                        },
                    },
                },
                payment: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        email: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ order });

    } catch (error) {
        console.error('Get order error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    const { id } = await params;
    return withAuth(request, (req, user) => getOrder(req, user, id));
}

// PUT update order status (Admin only)
async function updateOrderStatus(
    request: NextRequest,
    user: JWTPayload,
    id: string
) {
    try {
        const body = await request.json();
        const { orderStatus, notes } = body;

        const order = await prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Validate status transitions
        const validStatuses = ['PENDING', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
        if (orderStatus && !validStatuses.includes(orderStatus)) {
            return NextResponse.json(
                { error: 'Invalid order status' },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (orderStatus) updateData.orderStatus = orderStatus;
        if (notes !== undefined) updateData.notes = notes;

        // If order is cancelled or refunded, restore stock (with double-cancel guard)
        if (orderStatus === 'CANCELLED' || orderStatus === 'REFUNDED') {
            // Guard: Only restore stock if the order is not already cancelled/refunded
            if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'REFUNDED') {
                return NextResponse.json(
                    { error: `Order is already ${order.orderStatus.toLowerCase()}` },
                    { status: 400 }
                );
            }

            await prisma.$transaction(async (tx) => {
                const fullOrder = await tx.order.findUnique({
                    where: { id },
                    include: { items: true },
                });

                if (fullOrder) {
                    // Use shared restoreStock with variant-level awareness
                    await restoreStock(tx, fullOrder.items);
                }

                await tx.order.update({
                    where: { id },
                    data: updateData,
                });
            });
        } else {
            await prisma.order.update({
                where: { id },
                data: updateData,
            });
        }

        const updatedOrder = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                        combo: true,
                        hamper: true
                    }
                },
                payment: true,
            },
        });

        return NextResponse.json({
            message: 'Order updated successfully',
            order: updatedOrder,
        });

    } catch (error) {
        console.error('Update order error:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => updateOrderStatus(req, user, id));
}
