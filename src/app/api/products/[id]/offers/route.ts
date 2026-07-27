/**
 * GET /api/products/[id]/offers
 *
 * Public endpoint (no auth required) — returns eligible offers for a product.
 * Feature-flagged via ENABLE_PDP_OFFERS environment variable.
 * Rate-limited to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOffersForProduct } from '@/lib/coupon-eligibility';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Feature flag check
        if (process.env.ENABLE_PDP_OFFERS !== 'true') {
            return NextResponse.json({
                success: true,
                data: { productId: (await params).id, offers: [] },
            });
        }

        // Rate limit
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`pdp-offers:${ip}`, { maxRequests: 30, windowSeconds: 60 });
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { success: true, data: { productId: (await params).id, offers: [] } },
                { status: 200 } // Don't reveal rate limiting to storefront — just return empty
            );
        }

        const { id } = await params;

        if (!id || id.trim().length === 0) {
            return NextResponse.json({
                success: true,
                data: { productId: id || '', offers: [] },
            });
        }

        const offers = await getOffersForProduct(id);

        return NextResponse.json({
            success: true,
            data: {
                productId: id,
                offers,
            },
        });

    } catch (error) {
        console.error('PDP offers error:', error);
        // Never break the PDP — return empty offers on any error
        return NextResponse.json({
            success: true,
            data: { productId: '', offers: [] },
        });
    }
}
