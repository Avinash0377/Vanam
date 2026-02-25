
import crypto from 'crypto';
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

/** In-memory cache for delivery settings — avoids DB hit on every cart fetch */
let deliverySettingsCache: {
    data: { freeDeliveryEnabled: boolean; freeDeliveryMinAmount: number; flatDeliveryCharge: number } | null;
    expiresAt: number;
} = { data: null, expiresAt: 0 };

const DELIVERY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Invalidate the cache — call when admin updates delivery settings */
export function clearDeliverySettingsCache() {
    deliverySettingsCache = { data: null, expiresAt: 0 };
}

/**
 * Fetch the singleton DeliverySettings record (or return defaults).
 * Uses in-memory cache (5min TTL) unless a transaction client is provided.
 */
export async function getDeliverySettings(tx?: Prisma.TransactionClient): Promise<{
    freeDeliveryEnabled: boolean;
    freeDeliveryMinAmount: number;
    flatDeliveryCharge: number;
}> {
    // Bypass cache when inside a transaction (order finalization needs fresh data)
    if (!tx && deliverySettingsCache.data && Date.now() < deliverySettingsCache.expiresAt) {
        return deliverySettingsCache.data;
    }

    const db = tx || prisma;
    const settings = await db.deliverySettings.findUnique({ where: { id: 'default' } });
    const result = settings || DEFAULT_DELIVERY_SETTINGS;

    // Only cache non-transactional reads
    if (!tx) {
        deliverySettingsCache = { data: result, expiresAt: Date.now() + DELIVERY_CACHE_TTL_MS };
    }

    return result;
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
 * Generate a unique order number using crypto-random bytes.
 * Format: VAN<timestamp><8 random hex chars>
 * Entropy: 2^32 per millisecond — astronomically collision-resistant.
 */
export function generateOrderNumber(): string {
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `VAN${Date.now()}${randomPart}`;
}

/**
 * Generate a guaranteed-unique order number by checking the DB.
 * Retries up to 5 times on the rare chance of a collision.
 * Pass an optional transaction client for use inside $transaction blocks.
 */
export async function ensureUniqueOrderNumber(db?: Prisma.TransactionClient): Promise<string> {
    const conn = db || prisma;
    for (let attempt = 0; attempt < 5; attempt++) {
        const orderNumber = generateOrderNumber();
        const existing = await conn.order.findUnique({ where: { orderNumber } });
        if (!existing) return orderNumber;
    }
    throw new OrderError('Failed to generate a unique order number after 5 attempts');
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
                // Handle simple product stock decrement — atomically guard against going negative
                const updated = await tx.product.updateMany({
                    where: { id: item.productId!, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } },
                });
                if (updated.count === 0) {
                    // Another concurrent transaction already consumed the stock
                    throw new OrderError(`Insufficient stock for ${item.name}: stock was taken by a concurrent order`);
                }
            }
        } else if (item.comboId) {
            // Guard against going negative under concurrent orders (same as product path)
            const updatedCombo = await tx.combo.updateMany({
                where: { id: item.comboId, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } },
            });
            if (updatedCombo.count === 0) {
                throw new OrderError(`Insufficient stock for ${item.name}: stock was taken by a concurrent order`);
            }
        } else if (item.hamperId) {
            // Guard against going negative under concurrent orders (same as product path)
            const updatedHamper = await tx.giftHamper.updateMany({
                where: { id: item.hamperId, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } },
            });
            if (updatedHamper.count === 0) {
                throw new OrderError(`Insufficient stock for ${item.name}: stock was taken by a concurrent order`);
            }
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
            // Guard: skip if combo was deleted after order was placed
            const combo = await tx.combo.findUnique({ where: { id: item.comboId } });
            if (!combo) {
                console.warn(`restoreStock: combo ${item.comboId} no longer exists, skipping stock restore`);
            } else {
                await tx.combo.update({
                    where: { id: item.comboId },
                    data: { stock: { increment: item.quantity } },
                });
            }
        } else if (item.hamperId) {
            // Guard: skip if hamper was deleted after order was placed
            const hamper = await tx.giftHamper.findUnique({ where: { id: item.hamperId } });
            if (!hamper) {
                console.warn(`restoreStock: hamper ${item.hamperId} no longer exists, skipping stock restore`);
            } else {
                await tx.giftHamper.update({
                    where: { id: item.hamperId },
                    data: { stock: { increment: item.quantity } },
                });
            }
        }
    }
}
