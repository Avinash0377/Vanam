/**
 * Analytics Wrapper — GA4 + Meta Pixel
 *
 * All functions are safe to call anywhere:
 * - No-op if GA/Pixel not loaded
 * - No-op on server (window check)
 * - Never blocks UI (no await needed by callers)
 * - GA4 follows ecommerce item spec
 */

// ─── Type Declarations ────────────────────────────────────────────────

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
        fbq?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
    }
}

export interface AnalyticsItem {
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    item_category?: string;
}

// ─── Internal Helpers ─────────────────────────────────────────────────

function ga(command: string, ...args: unknown[]): void {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') return;
    window.gtag(command, ...args);
}

function pixel(event: string, params?: Record<string, unknown>): void {
    if (typeof window === 'undefined') return;
    if (typeof window.fbq !== 'function') return;
    window.fbq('track', event, params);
}

// ─── Page View ────────────────────────────────────────────────────────

/** Called automatically by route change listener in layout */
export function trackPageView(url: string): void {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
        ga('config', gaId, { page_path: url });
    }
    pixel('PageView');
}

// ─── Product View ─────────────────────────────────────────────────────

export function trackViewItem(product: {
    id: string;
    name: string;
    price: number;
    category?: string;
}): void {
    const item: AnalyticsItem = {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1,
        item_category: product.category,
    };

    ga('event', 'view_item', {
        currency: 'INR',
        value: product.price,
        items: [item],
    });

    pixel('ViewContent', {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: product.price,
        currency: 'INR',
    });
}

// ─── Add to Cart ─────────────────────────────────────────────────────
// Rule: fire only after successful cart API response — callers must
// await the cart operation before calling this function.

export function trackAddToCart(item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
}): void {
    const analyticsItem: AnalyticsItem = {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
    };

    ga('event', 'add_to_cart', {
        currency: 'INR',
        value: item.price * item.quantity,
        items: [analyticsItem],
    });

    pixel('AddToCart', {
        content_ids: [item.id],
        content_name: item.name,
        value: item.price * item.quantity,
        currency: 'INR',
    });
}

// ─── View Cart ────────────────────────────────────────────────────────

export function trackViewCart(items: AnalyticsItem[], total: number): void {
    ga('event', 'view_cart', {
        currency: 'INR',
        value: total,
        items,
    });
}

// ─── Begin Checkout ───────────────────────────────────────────────────
// Rule: only fire when user reaches checkout page AND cart has items.

export function trackBeginCheckout(items: AnalyticsItem[], total: number): void {
    ga('event', 'begin_checkout', {
        currency: 'INR',
        value: total,
        items,
    });

    pixel('InitiateCheckout', {
        value: total,
        currency: 'INR',
        num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    });
}

// ─── Purchase ─────────────────────────────────────────────────────────
// Rule: fire ONLY after backend confirms order (on order-confirmation page).
// Caller must use sessionStorage guard to prevent duplicate on page refresh.
// Value comes from backend — never from frontend calculation.

export function trackPurchase(
    orderId: string,
    value: number,
    items: AnalyticsItem[],
): void {
    ga('event', 'purchase', {
        transaction_id: orderId,
        value,
        currency: 'INR',
        items,
    });

    pixel('Purchase', {
        order_id: orderId,
        value,
        currency: 'INR',
        content_ids: items.map((i) => i.item_id),
        contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity })),
        content_type: 'product',
    });
}

// ─── WhatsApp Click ───────────────────────────────────────────────────
// Rule: do NOT await — never block navigation.

export function trackWhatsAppClick(source: string, productId?: string): void {
    ga('event', 'whatsapp_click', {
        event_category: 'engagement',
        event_label: source,
        product_id: productId,
        page_location: typeof window !== 'undefined' ? window.location.href : '',
    });

    pixel('Contact', {
        source,
        product_id: productId,
    });
}

// ─── Complete Registration ──────────────────────────────────────────────────
// Rule: fire only after backend confirms successful registration.

export function trackCompleteRegistration(): void {
    pixel('CompleteRegistration');
    ga('event', 'sign_up', { method: 'email' });
}
