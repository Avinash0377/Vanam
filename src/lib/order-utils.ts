
import prisma from '@/lib/prisma';
import { ProductWithVariants } from '@/lib/variants';
import { Prisma } from '@prisma/client';

/**
 * Typed business-rule error for order/stock/coupon failures.
 * Caught in route handlers to return HTTP 400 instead of 500.
 */
export class OrderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OrderError';
    }
}

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
    discountAmount: number;
    shippingCost: number;
    totalAmount: number;
}

// ==================== DELIVERY SETTINGS ====================

/** Default delivery settings when no DB record exists */
const DEFAULT_DELIVERY_SETTINGS = {
    freeDeliveryEnabled: true,
    freeDeliveryMinAmount: 999,
    flatDeliveryCharge: 99,
    deliveryChargeType: 'FLAT' as const,
};

/**
 * Fetch the singleton DeliverySettings record (or return defaults).
 */
export async function getDeliverySettings(tx?: Prisma.TransactionClient): Promise<{
    freeDeliveryEnabled: boolean;
    freeDeliveryMinAmount: number;
    flatDeliveryCharge: number;
}> {
    const db = tx || prisma;
    const settings = await db.deliverySettings.findUnique({ where: { id: 'default' } });
    return settings || DEFAULT_DELIVERY_SETTINGS;
}

/**
 * Calculate delivery charge based on settings.
 * FREE DELIVERY ELIGIBILITY: based on ORIGINAL subtotal (pre-discount).
 */
export function getDeliveryCharge(
    originalSubtotal: number,
    settings: { freeDeliveryEnabled: boolean; freeDeliveryMinAmount: number; flatDeliveryCharge: number },
): number {
    if (settings.freeDeliveryEnabled && originalSubtotal >= settings.freeDeliveryMinAmount) {
        return 0;
    }
    return settings.flatDeliveryCharge;
}

// ==================== ORDER TOTALS ====================

/**
 * Calculate order totals with optional coupon discount.
 * Uses DB-driven delivery settings.
 * Protects against negative totals.
 */
export function calculateOrderTotals(
    items: CartSnapshotItem[],
    options?: {
        discountAmount?: number;
        deliverySettings?: { freeDeliveryEnabled: boolean; freeDeliveryMinAmount: number; flatDeliveryCharge: number };
    },
): OrderTotals {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = options?.discountAmount || 0;

    const settings = options?.deliverySettings || DEFAULT_DELIVERY_SETTINGS;
    const shippingCost = getDeliveryCharge(subtotal, settings);

    // Never allow negative total
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);

    return {
        subtotal,
        discountAmount,
        shippingCost,
        totalAmount: Math.round(totalAmount * 100) / 100,
    };
}


/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
    // 8 random chars (base36) gives ~2.8 trillion combinations — collision-safe
    return `VAN${Date.now()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
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

            if (!product) throw new OrderError(`Product ${item.name} no longer exists`);

            // Check variant stock if applicable
            let availableStock = product.stock;
            if (item.size && product.sizeVariants && product.sizeVariants.length > 0) {
                const variant = product.sizeVariants.find(v => v.size === item.size);
                if (!variant) {
                    throw new OrderError(`Size ${item.size} is no longer available for ${item.name}`);
                }
                availableStock = variant.stock;
            }

            if (availableStock < item.quantity) {
                throw new OrderError(`Insufficient stock for ${item.name}${item.size ? ` (${item.size})` : ''}`);
            }

        } else if (item.comboId) {
            const combo = await db.combo.findUnique({ where: { id: item.comboId } });
            if (!combo) throw new OrderError(`${item.name} no longer exists`);
            if (combo.stock < item.quantity) {
                throw new OrderError(`Insufficient stock for ${item.name}`);
            }
        } else if (item.hamperId) {
            const hamper = await db.giftHamper.findUnique({ where: { id: item.hamperId } });
            if (!hamper) throw new OrderError(`${item.name} no longer exists`);
            if (hamper.stock < item.quantity) {
                throw new OrderError(`Insufficient stock for ${item.name}`);
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
                            throw new OrderError(`Insufficient stock for ${item.name} (${item.size}): available ${v.stock}, requested ${item.quantity}`);
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

            if (!product) {
                // Product was deleted after order was placed — log and skip to avoid crashing the cancellation
                console.warn(`restoreStock: product ${item.productId} no longer exists, skipping stock restore`);
                continue;
            }

            if (item.selectedSize && product.sizeVariants && product.sizeVariants.length > 0) {
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
