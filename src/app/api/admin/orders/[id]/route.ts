import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { restoreStock } from '@/lib/order-utils';
import { decrementCouponUsage } from '@/lib/coupon-utils';

// GET single order
async function getOrder(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, mobile: true, email: true } },
                items: {
                    include: {
                        product: { select: { name: true, images: true, slug: true } },
                        combo: { select: { name: true, images: true, slug: true } },
                        hamper: { select: { name: true, images: true, slug: true } }
                    }
                },
                payment: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);

    } catch (error) {
        console.error('Get order error:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAdmin(request, (req) => getOrder(req, context));
}

// PUT - Update order status
async function updateOrder(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { orderStatus, notes, trackingNumber, courierName, shippedAt, deliveredAt } = body;

        // Validate orderStatus against allowed values
        const validStatuses = ['PENDING', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
        if (orderStatus && !validStatuses.includes(orderStatus)) {
            return NextResponse.json(
                { error: 'Invalid order status' },
                { status: 400 }
            );
        }

        // Find the existing order first
        const existingOrder = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Double-cancel guard: prevent re-cancellation from inflating stock
        if (orderStatus === 'CANCELLED' || orderStatus === 'REFUNDED') {
            if (existingOrder.orderStatus === 'CANCELLED' || existingOrder.orderStatus === 'REFUNDED') {
                return NextResponse.json(
                    { error: `Order is already ${existingOrder.orderStatus.toLowerCase()}` },
                    { status: 400 }
                );
            }

            // Restore stock and decrement coupon usage within a transaction
            const order = await prisma.$transaction(async (tx) => {
                await restoreStock(tx, existingOrder.items);

                // Decrement coupon usage if order had a coupon applied
                if (existingOrder.couponCode) {
                    await decrementCouponUsage(existingOrder.couponCode, tx);
                }

                return tx.order.update({
                    where: { id },
                    data: {
                        orderStatus,
                        notes: notes || undefined,
                        trackingNumber: trackingNumber || undefined,
                        courierName: courierName || undefined,
                        shippedAt: shippedAt ? new Date(shippedAt) : undefined,
                        deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
                    },
                    include: {
                        user: { select: { name: true, mobile: true } },
                    },
                });
            });

            return NextResponse.json({ message: 'Order updated', order });
        }

        const order = await prisma.order.update({
            where: { id },
            data: {
                orderStatus,
                notes: notes || undefined,
                trackingNumber: trackingNumber || undefined,
                courierName: courierName || undefined,
                shippedAt: shippedAt ? new Date(shippedAt) : undefined,
                deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
            },
            include: {
                user: { select: { name: true, mobile: true } },
            },
        });

        return NextResponse.json({ message: 'Order updated', order });

    } catch (error) {
        console.error('Update order error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAdmin(request, (req) => updateOrder(req, context));
}
