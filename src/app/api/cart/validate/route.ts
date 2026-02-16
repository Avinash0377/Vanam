import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { getVariantStock, getVariantPrice } from '@/lib/variants';

interface ValidationIssue {
    itemId: string;
    itemName: string;
    type: 'product' | 'combo' | 'hamper';
    issue: 'NOT_FOUND' | 'INACTIVE' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK' | 'PRICE_CHANGED';
    message: string;
    availableStock?: number;
    requestedQuantity?: number;
    currentPrice?: number;
    cartPrice?: number;
}

async function validateCart(request: NextRequest, user: JWTPayload) {
    try {
        const cartItems = await prisma.cart.findMany({
            where: { userId: user.userId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        stock: true,
                        status: true,
                        sizeVariants: true,
                    },
                },
                combo: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        stock: true,
                        status: true,
                    },
                },
                hamper: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        stock: true,
                        status: true,
                    },
                },
            },
        });

        if (cartItems.length === 0) {
            return NextResponse.json({
                valid: false,
                issues: [],
                message: 'Your cart is empty',
            }, { status: 400 });
        }

        const issues: ValidationIssue[] = [];

        for (const item of cartItems) {
            // Product validation
            if (item.productId) {
                if (!item.product) {
                    issues.push({
                        itemId: item.id,
                        itemName: 'Unknown Product',
                        type: 'product',
                        issue: 'NOT_FOUND',
                        message: 'This product is no longer available',
                    });
                    continue;
                }

                if (item.product.status !== 'ACTIVE') {
                    issues.push({
                        itemId: item.id,
                        itemName: item.product.name,
                        type: 'product',
                        issue: 'INACTIVE',
                        message: `"${item.product.name}" is currently unavailable`,
                    });
                    continue;
                }

                const availableStock = getVariantStock(item.product, item.size);

                if (availableStock <= 0) {
                    issues.push({
                        itemId: item.id,
                        itemName: item.product.name,
                        type: 'product',
                        issue: 'OUT_OF_STOCK',
                        message: `"${item.product.name}"${item.size ? ` (${item.size})` : ''} is out of stock`,
                        availableStock: 0,
                        requestedQuantity: item.quantity,
                    });
                    continue;
                }

                if (item.quantity > availableStock) {
                    issues.push({
                        itemId: item.id,
                        itemName: item.product.name,
                        type: 'product',
                        issue: 'INSUFFICIENT_STOCK',
                        message: `Only ${availableStock} left for "${item.product.name}"${item.size ? ` (${item.size})` : ''}, but you have ${item.quantity} in cart`,
                        availableStock,
                        requestedQuantity: item.quantity,
                    });
                }

                // Price change detection could be added here in future
            }

            // Combo validation
            if (item.comboId) {
                if (!item.combo) {
                    issues.push({
                        itemId: item.id,
                        itemName: 'Unknown Combo',
                        type: 'combo',
                        issue: 'NOT_FOUND',
                        message: 'This combo is no longer available',
                    });
                    continue;
                }

                if (item.combo.status !== 'ACTIVE') {
                    issues.push({
                        itemId: item.id,
                        itemName: item.combo.name,
                        type: 'combo',
                        issue: 'INACTIVE',
                        message: `"${item.combo.name}" combo is currently unavailable`,
                    });
                    continue;
                }

                if (item.combo.stock <= 0) {
                    issues.push({
                        itemId: item.id,
                        itemName: item.combo.name,
                        type: 'combo',
                        issue: 'OUT_OF_STOCK',
                        message: `"${item.combo.name}" combo is out of stock`,
                        availableStock: 0,
                        requestedQuantity: item.quantity,
                    });
                } else if (item.quantity > item.combo.stock) {
                    issues.push({
                        itemId: item.id,
                        itemName: item.combo.name,
                        type: 'combo',
                        issue: 'INSUFFICIENT_STOCK',
                        message: `Only ${item.combo.stock} left for "${item.combo.name}" combo, but you have ${item.quantity} in cart`,
                        availableStock: item.combo.stock,
                        requestedQuantity: item.quantity,
                    });
                }
            }

            // Hamper validation
            if (item.hamperId) {
                if (!item.hamper) {
                    issues.push({
                        itemId: item.id,
                        itemName: 'Unknown Gift Hamper',
                        type: 'hamper',
                        issue: 'NOT_FOUND',
                        message: 'This gift hamper is no longer available',
                    });
                    continue;
                }

                if (item.hamper.status !== 'ACTIVE') {
                    issues.push({
                        itemId: item.id,
                        itemName: item.hamper.name,
                        type: 'hamper',
                        issue: 'INACTIVE',
                        message: `"${item.hamper.name}" gift hamper is currently unavailable`,
                    });
                    continue;
                }

                if (item.hamper.stock <= 0) {
                    issues.push({
                        itemId: item.id,
                        itemName: item.hamper.name,
                        type: 'hamper',
                        issue: 'OUT_OF_STOCK',
                        message: `"${item.hamper.name}" gift hamper is out of stock`,
                        availableStock: 0,
                        requestedQuantity: item.quantity,
                    });
                } else if (item.quantity > item.hamper.stock) {
                    issues.push({
                        itemId: item.id,
                        itemName: item.hamper.name,
                        type: 'hamper',
                        issue: 'INSUFFICIENT_STOCK',
                        message: `Only ${item.hamper.stock} left for "${item.hamper.name}" gift hamper, but you have ${item.quantity} in cart`,
                        availableStock: item.hamper.stock,
                        requestedQuantity: item.quantity,
                    });
                }
            }
        }

        const valid = issues.length === 0;

        return NextResponse.json({
            valid,
            issues,
            itemCount: cartItems.length,
            message: valid
                ? 'All items are available'
                : `${issues.length} item(s) in your cart have issues`,
        });
    } catch (error) {
        console.error('Cart validation error:', error);
        return NextResponse.json(
            { error: 'Failed to validate cart' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return withAuth(request, validateCart);
}
