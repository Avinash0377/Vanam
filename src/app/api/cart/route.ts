import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { ProductStatus } from '@prisma/client';
import { SizeVariant, getVariantPrice, getVariantStock } from '@/lib/variants';

// GET user's cart
async function getCart(request: NextRequest, user: JWTPayload) {
    try {
        const cartItems = await prisma.cart.findMany({
            where: { userId: user.userId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        comparePrice: true,
                        images: true,
                        stock: true,
                        status: true,
                        size: true,
                        sizeVariants: true,
                    },
                },
                combo: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        comparePrice: true,
                        images: true,
                        stock: true,
                        status: true,
                    },
                },
                hamper: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        comparePrice: true,
                        images: true,
                        stock: true,
                        status: true,
                    },
                },
            },
        });

        // Separate items by type for frontend consumption
        const items = cartItems.filter(item => item.productId).map(item => {
            const variantPrice = getVariantPrice(item.product!, item.size);
            return {
                id: item.id,
                quantity: item.quantity,
                product: {
                    ...item.product,
                    price: variantPrice, // Override with variant price
                },
                size: item.size,
                selectedColor: item.selectedColor,
                colorImage: item.colorImage,
            };
        });

        const comboItems = cartItems.filter(item => item.comboId).map(item => ({
            id: item.id,
            quantity: item.quantity,
            combo: item.combo,
        }));

        const hamperItems = cartItems.filter(item => item.hamperId).map(item => ({
            id: item.id,
            quantity: item.quantity,
            customMessage: item.customMessage,
            hamper: item.hamper,
        }));

        // Calculate totals using variant prices
        let itemCount = 0;
        let subtotal = 0;

        cartItems.forEach((item) => {
            itemCount += item.quantity;
            if (item.product) {
                const variantPrice = getVariantPrice(item.product, item.size);
                subtotal += variantPrice * item.quantity;
            } else if (item.combo) {
                subtotal += item.combo.price * item.quantity;
            } else if (item.hamper) {
                subtotal += item.hamper.price * item.quantity;
            }
        });

        return NextResponse.json({
            cart: {
                items,
                comboItems,
                hamperItems,
            },
            summary: {
                itemCount,
                subtotal,
                shipping: subtotal >= 999 ? 0 : 99,
                total: subtotal >= 999 ? subtotal : subtotal + 99,
            },
        });

    } catch (error) {
        console.error('Get cart error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cart' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return withAuth(request, getCart);
}

// POST add item to cart
async function addToCart(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { productId, comboId, hamperId, quantity = 1, customMessage, size, selectedColor, colorImage } = body;

        // Validate quantity bounds
        const safeQuantity = Math.max(1, Math.min(10, Number(quantity) || 1));

        if (!productId && !comboId && !hamperId) {
            return NextResponse.json(
                { error: 'Product ID, Combo ID, or Hamper ID is required' },
                { status: 400 }
            );
        }

        let existingItem;

        if (productId) {
            const product = await prisma.product.findUnique({ where: { id: productId } });
            if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

            // Fix 6: Check product is ACTIVE
            if (product.status !== ProductStatus.ACTIVE) {
                return NextResponse.json({ error: 'Product is not available' }, { status: 400 });
            }

            // Fix 3: Check variant-level stock if size provided
            const availableStock = getVariantStock(product as { stock: number; sizeVariants?: SizeVariant[] }, size);
            if (availableStock < safeQuantity) {
                return NextResponse.json({ error: 'Insufficient stock for selected size' }, { status: 400 });
            }

            existingItem = await prisma.cart.findFirst({
                where: { userId: user.userId, productId, size, selectedColor },
            });
        } else if (comboId) {
            const combo = await prisma.combo.findUnique({ where: { id: comboId } });
            if (!combo) return NextResponse.json({ error: 'Combo not found' }, { status: 404 });

            // Fix 6: Check combo is ACTIVE
            if (combo.status !== ProductStatus.ACTIVE) {
                return NextResponse.json({ error: 'Combo is not available' }, { status: 400 });
            }

            if (combo.stock < safeQuantity) return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });

            existingItem = await prisma.cart.findFirst({
                where: { userId: user.userId, comboId },
            });
        } else if (hamperId) {
            const hamper = await prisma.giftHamper.findUnique({ where: { id: hamperId } });
            if (!hamper) return NextResponse.json({ error: 'Hamper not found' }, { status: 404 });

            // Fix 6: Check hamper is ACTIVE
            if (hamper.status !== ProductStatus.ACTIVE) {
                return NextResponse.json({ error: 'Gift hamper is not available' }, { status: 400 });
            }

            if (hamper.stock < safeQuantity) return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });

            existingItem = await prisma.cart.findFirst({
                where: { userId: user.userId, hamperId },
            });
        }

        if (existingItem) {
            const newQuantity = Math.min(10, existingItem.quantity + safeQuantity);
            await prisma.cart.update({
                where: { id: existingItem.id },
                data: {
                    quantity: newQuantity,
                    ...(size && { size }),
                    ...(selectedColor && { selectedColor }),
                    ...(colorImage && { colorImage }),
                },
            });
        } else {
            await prisma.cart.create({
                data: {
                    userId: user.userId,
                    productId: productId || undefined,
                    comboId: comboId || undefined,
                    hamperId: hamperId || undefined,
                    quantity: safeQuantity,
                    customMessage,
                    size,
                    selectedColor,
                    colorImage,
                },
            });
        }

        return NextResponse.json({
            message: 'Item added to cart',
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        return NextResponse.json(
            { error: 'Failed to add item to cart' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAuth(request, addToCart);
}

// PUT merge guest cart (Fix 4)
async function mergeGuestCart(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { items = [], comboItems = [], hamperItems = [] } = body;

        // Helper: sanitize quantity to valid range 1-10
        const sanitizeQty = (q: unknown): number => {
            const n = typeof q === 'number' ? q : parseInt(String(q)) || 1;
            return Math.max(1, Math.min(10, Math.floor(n)));
        };

        // Merge product items
        for (const item of items) {
            if (!item.productId) continue;

            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product || product.status !== ProductStatus.ACTIVE) continue;

            const safeQty = sanitizeQty(item.quantity);

            const existingItem = await prisma.cart.findFirst({
                where: { userId: user.userId, productId: item.productId, size: item.size, selectedColor: item.color },
            });

            if (existingItem) {
                const newQty = Math.min(10, existingItem.quantity + safeQty);
                await prisma.cart.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQty },
                });
            } else {
                await prisma.cart.create({
                    data: {
                        userId: user.userId,
                        productId: item.productId,
                        quantity: safeQty,
                        size: item.size,
                        selectedColor: item.color,
                        colorImage: item.image,
                    },
                });
            }
        }

        // Merge combo items
        for (const item of comboItems) {
            if (!item.comboId) continue;

            const combo = await prisma.combo.findUnique({ where: { id: item.comboId } });
            if (!combo || combo.status !== ProductStatus.ACTIVE) continue;

            const existingItem = await prisma.cart.findFirst({
                where: { userId: user.userId, comboId: item.comboId },
            });

            if (existingItem) {
                const comboQty = sanitizeQty(item.quantity);
                const newQty = Math.min(10, existingItem.quantity + comboQty);
                await prisma.cart.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQty },
                });
            } else {
                await prisma.cart.create({
                    data: {
                        userId: user.userId,
                        comboId: item.comboId,
                        quantity: sanitizeQty(item.quantity),
                    },
                });
            }
        }

        // Merge hamper items
        for (const item of hamperItems) {
            if (!item.hamperId) continue;

            const hamper = await prisma.giftHamper.findUnique({ where: { id: item.hamperId } });
            if (!hamper || hamper.status !== ProductStatus.ACTIVE) continue;

            const existingItem = await prisma.cart.findFirst({
                where: { userId: user.userId, hamperId: item.hamperId },
            });

            if (existingItem) {
                const hamperQty = sanitizeQty(item.quantity);
                const newQty = Math.min(10, existingItem.quantity + hamperQty);
                await prisma.cart.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQty },
                });
            } else {
                await prisma.cart.create({
                    data: {
                        userId: user.userId,
                        hamperId: item.hamperId,
                        quantity: sanitizeQty(item.quantity),
                        customMessage: item.customMessage,
                    },
                });
            }
        }

        return NextResponse.json({ message: 'Cart merged successfully' });

    } catch (error) {
        console.error('Merge cart error:', error);
        return NextResponse.json(
            { error: 'Failed to merge cart' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    return withAuth(request, mergeGuestCart);
}

// DELETE clear cart
async function clearCart(request: NextRequest, user: JWTPayload) {
    try {
        await prisma.cart.deleteMany({
            where: { userId: user.userId },
        });

        return NextResponse.json({
            message: 'Cart cleared',
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        return NextResponse.json(
            { error: 'Failed to clear cart' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    return withAuth(request, clearCart);
}
