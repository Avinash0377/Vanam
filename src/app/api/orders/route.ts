import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { orderSchema } from '@/lib/validators';
import { ProductWithVariants, getVariantPrice } from '@/lib/variants';
import {
    calculateOrderTotals,
    generateOrderNumber,
    createOrderItems,
    decrementStock,
    validateStockAvailability
} from '@/lib/order-utils';

// GET orders (user gets their orders, admin gets all)
async function getOrders(request: NextRequest, user: JWTPayload) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10') || 10));
        const status = searchParams.get('status');

        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        // Non-admin users can only see their own orders
        if (user.role !== 'ADMIN') {
            where.userId = user.userId;
        }

        if (status) {
            where.orderStatus = status;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: {
                        include: {
                            product: { select: { id: true, name: true, slug: true, images: true } },
                            combo: { select: { id: true, name: true, slug: true, images: true } },
                            hamper: { select: { id: true, name: true, slug: true, images: true } },
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return withAuth(request, getOrders);
}

// POST create order
async function createOrder(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        // Validation
        const validation = orderSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const {
            customerName,
            mobile,
            email,
            address,
            city,
            state,
            pincode,
            paymentMethod,
            notes,
        } = validation.data;

        // Validate pincode is serviceable
        const serviceablePincode = await prisma.serviceablePincode.findFirst({
            where: { pincode, isActive: true },
        });

        if (!serviceablePincode) {
            return NextResponse.json(
                { error: 'Delivery not available in this area.' },
                { status: 400 }
            );
        }

        // Get user's cart items with product sizeVariants
        const cartItems = await prisma.cart.findMany({
            where: { userId: user.userId },
            include: {
                product: true,
                combo: true,
                hamper: true,
            },
        });

        if (cartItems.length === 0) {
            return NextResponse.json(
                { error: 'Cart is empty' },
                { status: 400 }
            );
        }

        // Validate all products/combos/hampers are ACTIVE before allowing order
        for (const item of cartItems) {
            if (item.product && item.product.status !== 'ACTIVE') {
                return NextResponse.json(
                    { error: `Product "${item.product.name}" is no longer available` },
                    { status: 400 }
                );
            }
            if (item.combo && item.combo.status !== 'ACTIVE') {
                return NextResponse.json(
                    { error: `Combo "${item.combo.name}" is no longer available` },
                    { status: 400 }
                );
            }
            if (item.hamper && item.hamper.status !== 'ACTIVE') {
                return NextResponse.json(
                    { error: `Gift hamper "${item.hamper.name}" is no longer available` },
                    { status: 400 }
                );
            }
        }

        // Map Prisma cart items to CartSnapshotItem[]
        const cartSnapshot = cartItems.map(item => {
            let name = '';
            let price = 0;
            let image: string | null = null;

            if (item.product) {
                const productWithVariants = item.product as unknown as ProductWithVariants;
                name = item.product.name;
                price = getVariantPrice(productWithVariants, item.size);
                image = item.colorImage || item.product.images[0] || null;
            } else if (item.combo) {
                name = item.combo.name;
                price = item.combo.price;
                image = item.combo.images[0] || null;
            } else if (item.hamper) {
                name = item.hamper.name;
                price = item.hamper.price;
                image = item.hamper.images[0] || null;
            }

            return {
                productId: item.productId || undefined,
                comboId: item.comboId || undefined,
                hamperId: item.hamperId || undefined,
                name,
                price,
                quantity: item.quantity,
                image,
                size: item.size || undefined,
                selectedColor: item.selectedColor || undefined,
                colorImage: item.colorImage || undefined,
                customMessage: item.customMessage || undefined,
            };
        });

        // 1. Calculate Totals (Shared Logic)
        const { subtotal, shippingCost, totalAmount } = calculateOrderTotals(cartSnapshot);

        // 2. Generate Order Number (Shared Logic)
        const orderNumber = generateOrderNumber();

        // 3. Create Order Transaction with stock validation INSIDE the transaction
        const order = await prisma.$transaction(async (tx) => {
            // Validate stock inside transaction to prevent race conditions
            await validateStockAvailability(cartSnapshot, tx);

            // Create order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    userId: user.userId,
                    customerName,
                    mobile,
                    email: email || null,
                    address,
                    city,
                    state,
                    pincode,
                    subtotal,
                    shippingCost,
                    totalAmount,
                    paymentMethod,
                    orderStatus: 'PENDING',
                    notes: notes || null,
                },
            });

            // Create order items
            await createOrderItems(tx, newOrder.id, cartSnapshot);

            // Decrement stock
            await decrementStock(tx, cartSnapshot);

            // Clear cart
            await tx.cart.deleteMany({ where: { userId: user.userId } });

            return newOrder;
        });

        // Fetch complete order with details
        const completeOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                items: {
                    include: {
                        product: true,
                        combo: true,
                        hamper: true
                    }
                },
            },
        });

        return NextResponse.json({
            message: 'Order created successfully',
            order: completeOrder,
        }, { status: 201 });

    } catch (error) {
        // Check if it's a stock validation error (thrown from inside transaction)
        if (error instanceof Error && (error.message.includes('Insufficient stock') || error.message.includes('no longer exists'))) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
        console.error('Create order error:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAuth(request, createOrder);
}
