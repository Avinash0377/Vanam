
import prisma from '@/lib/prisma';
import { ProductWithVariants } from '@/lib/variants';
import { Prisma } from '@prisma/client';

export interface CartSnapshotItem {
    productId?: string;
    comboId?: string;
    hamperId?: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
    size?: string;
    selectedColor?: string;
    colorImage?: string;
    customMessage?: string;
}

export interface OrderTotals {
    subtotal: number;
    shippingCost: number;
    totalAmount: number;
}

/**
 * Calculate order totals
 */
export function calculateOrderTotals(items: CartSnapshotItem[]): OrderTotals {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal >= 999 ? 0 : 99;

    return {
        subtotal,
        shippingCost,
        totalAmount: subtotal + shippingCost
    };
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
    return `VAN${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}

/**
 * Check stock availability for a list of items
 * Throws error if any item is out of stock
 * Accepts optional transaction client for use inside $transaction blocks
 */
export async function validateStockAvailability(
    items: CartSnapshotItem[],
    client?: Prisma.TransactionClient
): Promise<void> {
    const db = client || prisma;
    for (const item of items) {
        if (item.productId) {
            const product = await db.product.findUnique({
                where: { id: item.productId },
            }) as unknown as ProductWithVariants | null;

            if (!product) throw new Error(`Product ${item.name} no longer exists`);

            // Check variant stock if applicable
            let availableStock = product.stock;
            if (item.size && product.sizeVariants && product.sizeVariants.length > 0) {
                const variant = product.sizeVariants.find(v => v.size === item.size);
                availableStock = variant?.stock || 0;
            }

            if (availableStock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}${item.size ? ` (${item.size})` : ''}`);
            }

        } else if (item.comboId) {
            const combo = await db.combo.findUnique({ where: { id: item.comboId } });
            if (!combo || combo.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}`);
            }
        } else if (item.hamperId) {
            const hamper = await db.giftHamper.findUnique({ where: { id: item.hamperId } });
            if (!hamper || hamper.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}`);
            }
        }
    }
}

/**
 * Decrement stock for a list of items within a transaction
 */
export async function decrementStock(tx: Prisma.TransactionClient, items: CartSnapshotItem[]): Promise<void> {
    for (const item of items) {
        if (item.productId) {
            const product = await tx.product.findUnique({
                where: { id: item.productId },
            }) as unknown as ProductWithVariants | null;

            if (product && item.size && product.sizeVariants && product.sizeVariants.length > 0) {
                // Handle variant stock decrement — throw if insufficient
                const updatedVariants = product.sizeVariants.map(v => {
                    if (v.size === item.size) {
                        const newStock = v.stock - item.quantity;
                        if (newStock < 0) {
                            throw new Error(`Insufficient stock for ${item.name} (${item.size}): available ${v.stock}, requested ${item.quantity}`);
                        }
                        return { ...v, stock: newStock };
                    }
                    return v;
                });
                const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);

                await tx.product.update({
                    where: { id: item.productId },
                    data: { sizeVariants: updatedVariants, stock: newTotalStock },
                });
            } else {
                // Handle simple product stock decrement
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }
        } else if (item.comboId) {
            await tx.combo.update({
                where: { id: item.comboId },
                data: { stock: { decrement: item.quantity } },
            });
        } else if (item.hamperId) {
            await tx.giftHamper.update({
                where: { id: item.hamperId },
                data: { stock: { decrement: item.quantity } },
            });
        }
    }
}

/**
 * Create OrderItems within a transaction
 */
export async function createOrderItems(tx: Prisma.TransactionClient, orderId: string, items: CartSnapshotItem[]): Promise<void> {
    for (const item of items) {
        await tx.orderItem.create({
            data: {
                orderId,
                productId: item.productId || undefined,
                comboId: item.comboId || undefined,
                hamperId: item.hamperId || undefined,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                customMessage: item.customMessage,
                selectedSize: item.size,
                selectedColor: item.selectedColor,
                colorImage: item.colorImage,
            },
        });
    }
}

/**
 * Restore stock for order items on cancellation/refund (variant-aware).
 * Must be called inside a $transaction block.
 */
export async function restoreStock(
    tx: Prisma.TransactionClient,
    items: { productId: string | null; comboId: string | null; hamperId: string | null; quantity: number; selectedSize: string | null }[]
): Promise<void> {
    for (const item of items) {
        if (item.productId) {
            const product = await tx.product.findUnique({
                where: { id: item.productId },
            }) as unknown as ProductWithVariants | null;

            if (product && item.selectedSize && product.sizeVariants && product.sizeVariants.length > 0) {
                // Restore variant-level stock
                const updatedVariants = product.sizeVariants.map(v => {
                    if (v.size === item.selectedSize) {
                        return { ...v, stock: v.stock + item.quantity };
                    }
                    return v;
                });
                const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);

                await tx.product.update({
                    where: { id: item.productId },
                    data: { sizeVariants: updatedVariants, stock: newTotalStock },
                });
            } else {
                // Restore base product stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }
        } else if (item.comboId) {
            await tx.combo.update({
                where: { id: item.comboId },
                data: { stock: { increment: item.quantity } },
            });
        } else if (item.hamperId) {
            await tx.giftHamper.update({
                where: { id: item.hamperId },
                data: { stock: { increment: item.quantity } },
            });
        }
    }
}
