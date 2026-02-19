import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

interface SizeVariant {
    size: string;
    stock: number;
    [key: string]: unknown;
}

interface RouteParams {
    params: Promise<{ itemId: string }>;
}

// PUT update cart item quantity
async function updateCartItem(
    request: NextRequest,
    user: JWTPayload,
    itemId: string
) {
    try {
        const body = await request.json();
        const { quantity } = body;

        // Validate quantity is a number and in valid range
        const parsedQty = typeof quantity === 'number' ? quantity : parseInt(String(quantity));
        if (isNaN(parsedQty) || parsedQty < 1) {
            return NextResponse.json(
                { error: 'Quantity must be at least 1' },
                { status: 400 }
            );
        }
        if (parsedQty > 10) {
            return NextResponse.json(
                { error: 'Maximum quantity is 10' },
                { status: 400 }
            );
        }

        // Find the cart item by ID
        const cartItem = await prisma.cart.findUnique({
            where: { id: itemId },
            include: {
                product: true,
                combo: true,
                hamper: true,
            },
        });

        if (!cartItem) {
            return NextResponse.json(
                { error: 'Cart item not found' },
                { status: 404 }
            );
        }

        // Verify this cart item belongs to the user
        if (cartItem.userId !== user.userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Check stock availability (variant-aware)
        let stock = 0;
        if (cartItem.product) {
            // Check variant stock if applicable
            const sizeVariants = cartItem.product.sizeVariants as SizeVariant[] | null;
            if (cartItem.size && sizeVariants && sizeVariants.length > 0) {
                const variant = sizeVariants.find((v) => v.size === cartItem.size);
                stock = variant?.stock ?? 0;
            } else {
                stock = cartItem.product.stock;
            }
        }
        else if (cartItem.combo) stock = cartItem.combo.stock;
        else if (cartItem.hamper) stock = cartItem.hamper.stock;

        if (stock < parsedQty) {
            return NextResponse.json(
                { error: 'Insufficient stock' },
                { status: 400 }
            );
        }

        await prisma.cart.update({
            where: { id: itemId },
            data: { quantity: parsedQty },
        });

        return NextResponse.json({
            message: 'Cart item updated',
        });

    } catch (error) {
        console.error('Update cart item error:', error);
        return NextResponse.json(
            { error: 'Failed to update cart item' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    const { itemId } = await params;
    return withAuth(request, (req, user) => updateCartItem(req, user, itemId));
}

// DELETE remove cart item
async function deleteCartItem(
    request: NextRequest,
    user: JWTPayload,
    itemId: string
) {
    try {
        // Find the cart item by ID
        const cartItem = await prisma.cart.findUnique({
            where: { id: itemId },
        });

        if (!cartItem) {
            return NextResponse.json(
                { error: 'Cart item not found' },
                { status: 404 }
            );
        }

        // Verify this cart item belongs to the user
        if (cartItem.userId !== user.userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        await prisma.cart.delete({
            where: { id: itemId },
        });

        return NextResponse.json({
            message: 'Item removed from cart',
        });

    } catch (error) {
        console.error('Delete cart item error:', error);
        return NextResponse.json(
            { error: 'Failed to delete cart item' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    const { itemId } = await params;
    return withAuth(request, (req, user) => deleteCartItem(req, user, itemId));
}
