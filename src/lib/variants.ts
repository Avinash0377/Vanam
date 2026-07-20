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

export interface PlanterVariant {
    name: string;
    price: number;
    comparePrice?: number | null;
    stock: number;
    colors?: VariantColor[];
}

export interface SizeVariant {
    size: string;
    price: number;
    comparePrice?: number | null;
    stock: number;
    colors?: VariantColor[];
    planters?: PlanterVariant[];
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
    comparePrice?: number | null;
    stock: number;
    images: string[];
    status?: string;
    sizeVariants: SizeVariant[];
}

/** Resolve the size variant for a given size selection */
function resolveVariant(
    sizeVariants: SizeVariant[] | undefined,
    size?: string | null
): SizeVariant | undefined {
    if (!sizeVariants || sizeVariants.length === 0) return undefined;
    const resolvedSize = size || (sizeVariants.length === 1 ? sizeVariants[0].size : null);
    if (!resolvedSize) return undefined;
    return sizeVariants.find(v => v.size === resolvedSize);
}

/** Resolve the planter within a variant for a given planter name */
function resolvePlanter(
    variant: SizeVariant | undefined,
    planter?: string | null
): PlanterVariant | undefined {
    if (!variant?.planters || variant.planters.length === 0) return undefined;
    if (planter) {
        const match = variant.planters.find(p => p.name === planter);
        if (match) return match;
    }
    // Fall back to first planter when none specified
    return variant.planters[0];
}

/** Get price from planter/size variant or fall back to base price */
export function getVariantPrice(
    product: { price: number; sizeVariants?: SizeVariant[] },
    size?: string | null,
    planter?: string | null
): number {
    const variant = resolveVariant(product.sizeVariants, size);
    if (variant) {
        const planterVariant = resolvePlanter(variant, planter);
        if (planterVariant) return planterVariant.price;
        return variant.price;
    }
    return product.price;
}

/** Get compare price from planter/size variant or fall back to base compare price */
export function getVariantComparePrice(
    product: { comparePrice?: number | null; sizeVariants?: SizeVariant[] },
    size?: string | null,
    planter?: string | null
): number | undefined {
    const variant = resolveVariant(product.sizeVariants, size);
    if (variant) {
        const planterVariant = resolvePlanter(variant, planter);
        if (planterVariant && planterVariant.comparePrice) return planterVariant.comparePrice;
        if (variant.comparePrice) return variant.comparePrice;
    }
    return product.comparePrice || undefined;
}

/** Get stock from planter/size variant or fall back to base stock */
export function getVariantStock(
    product: { stock: number; sizeVariants?: SizeVariant[] },
    size?: string | null,
    planter?: string | null
): number {
    const variant = resolveVariant(product.sizeVariants, size);
    if (variant) {
        const planterVariant = resolvePlanter(variant, planter);
        if (planterVariant) return planterVariant.stock;
        return variant.stock;
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

