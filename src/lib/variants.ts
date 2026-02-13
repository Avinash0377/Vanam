/**
 * Shared product variant helpers
 * Used by: orders, payments, cart, and payment-finalize
 */

/** Sentinel size value for products that don't need size selection */
export const DEFAULT_SIZE = 'DEFAULT';

/** Check if a size is the default (no-size) variant */
export function isDefaultSize(size?: string | null): boolean {
    return size === DEFAULT_SIZE;
}

export interface SizeVariant {
    size: string;
    price: number;
    stock: number;
    colors?: VariantColor[];
}

export interface VariantColor {
    name: string;
    hex: string;
    images?: string[];
}

export interface ProductWithVariants {
    id: string;
    name: string;
    price: number;
    stock: number;
    images: string[];
    status?: string;
    sizeVariants: SizeVariant[];
}

/** Get price from size variant or fall back to base price */
export function getVariantPrice(
    product: { price: number; sizeVariants?: SizeVariant[] },
    size?: string | null
): number {
    if (product.sizeVariants && product.sizeVariants.length > 0) {
        // If size is provided, look it up; otherwise auto-resolve if there's only one variant
        const resolvedSize = size || (product.sizeVariants.length === 1 ? product.sizeVariants[0].size : null);
        if (resolvedSize) {
            const variant = product.sizeVariants.find(v => v.size === resolvedSize);
            if (variant) return variant.price;
        }
    }
    return product.price;
}

/** Get stock from size variant or fall back to base stock */
export function getVariantStock(
    product: { stock: number; sizeVariants?: SizeVariant[] },
    size?: string | null
): number {
    if (product.sizeVariants && product.sizeVariants.length > 0) {
        const resolvedSize = size || (product.sizeVariants.length === 1 ? product.sizeVariants[0].size : null);
        if (resolvedSize) {
            const variant = product.sizeVariants.find(v => v.size === resolvedSize);
            if (variant) return variant.stock;
        }
    }
    return product.stock;
}
