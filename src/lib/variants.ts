/**
 * Shared product variant helpers
 * Used by: orders, payments, cart, and payment-finalize
 */

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
    if (size && product.sizeVariants && product.sizeVariants.length > 0) {
        const variant = product.sizeVariants.find(v => v.size === size);
        if (variant) return variant.price;
    }
    return product.price;
}

/** Get stock from size variant or fall back to base stock */
export function getVariantStock(
    product: { stock: number; sizeVariants?: SizeVariant[] },
    size?: string | null
): number {
    if (size && product.sizeVariants && product.sizeVariants.length > 0) {
        const variant = product.sizeVariants.find(v => v.size === size);
        if (variant) return variant.stock;
    }
    return product.stock;
}
