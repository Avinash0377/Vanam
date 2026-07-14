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
    comparePrice?: number;
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
    comparePrice?: number;
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

/** Get compare price from size variant or fall back to base compare price */
export function getVariantComparePrice(
    product: { comparePrice?: number | null; sizeVariants?: SizeVariant[] },
    size?: string | null
): number | undefined {
    if (product.sizeVariants && product.sizeVariants.length > 0) {
        const resolvedSize = size || (product.sizeVariants.length === 1 ? product.sizeVariants[0].size : null);
        if (resolvedSize) {
            const variant = product.sizeVariants.find(v => v.size === resolvedSize);
            if (variant && variant.comparePrice) return variant.comparePrice;
        }
    }
    return product.comparePrice || undefined;
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

/**
 * Generate product/combo/hamper detail page URL path
 */
export function getProductHref(
    type?: string | null,
    slug?: string | null,
    category?: string | null
): string {
    if (!slug) return '#';
    const normalizedType = (type || '').toUpperCase();
    if (normalizedType === 'COMBO' || normalizedType === 'COMBOS') {
        return `/combos/${slug}`;
    }
    if (normalizedType === 'HAMPER' || normalizedType === 'HAMPERS' || normalizedType === 'GIFT-HAMPER' || normalizedType === 'GIFT-HAMPERS') {
        return `/gift-hampers/${slug}`;
    }
    if (normalizedType === 'POT' || normalizedType === 'PLANTER') {
        return `/pots/${slug}`;
    }
    if (normalizedType === 'SEED' || normalizedType === 'ACCESSORY') {
        return `/product/${slug}`;
    }
    if (normalizedType === 'PLANT') {
        return `/plants/${slug}`;
    }

    // Fallbacks based on category if type is generic or missing
    const normalizedCategory = (category || '').toLowerCase();
    if (normalizedCategory === 'pots' || normalizedCategory === 'planters') {
        return `/pots/${slug}`;
    }
    if (normalizedCategory === 'combos') {
        return `/combos/${slug}`;
    }
    if (normalizedCategory === 'gift-hampers' || normalizedCategory === 'hampers') {
        return `/gift-hampers/${slug}`;
    }
    if (normalizedCategory === 'plants') {
        return `/plants/${slug}`;
    }

    return `/product/${slug}`;
}

