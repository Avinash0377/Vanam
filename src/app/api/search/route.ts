import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ProductStatus } from '@prisma/client';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// GET /api/search?q=monstera&limit=8
// Searches products, combos, and hampers in parallel
export async function GET(request: NextRequest) {
    try {
        // Rate limit: 30 search requests/min per IP to prevent regex DoS
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`search:${ip}`, { maxRequests: 30, windowSeconds: 60 });
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many search requests. Please slow down.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
            );
        }

        const { searchParams } = new URL(request.url);
        const rawQuery = searchParams.get('q')?.trim() ?? '';
        // Cap query length to prevent excessively long regex patterns
        const query = rawQuery.slice(0, 100);
        const limit = Math.min(12, Math.max(1, parseInt(searchParams.get('limit') || '8') || 8));

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const searchFilter = { contains: query, mode: 'insensitive' as const };

        // Search all three collections in parallel
        const [products, combos, hampers] = await Promise.all([
            prisma.product.findMany({
                where: {
                    status: ProductStatus.ACTIVE,
                    OR: [
                        { name: searchFilter },
                        { description: searchFilter },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true,
                    productType: true,
                },
                take: limit,
                orderBy: { featured: 'desc' },
            }),

            prisma.combo.findMany({
                where: {
                    status: ProductStatus.ACTIVE,
                    OR: [
                        { name: searchFilter },
                        { description: searchFilter },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true,
                },
                take: Math.ceil(limit / 2),
                orderBy: { featured: 'desc' },
            }),

            prisma.giftHamper.findMany({
                where: {
                    status: ProductStatus.ACTIVE,
                    OR: [
                        { name: searchFilter },
                        { description: searchFilter },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true,
                },
                take: Math.ceil(limit / 2),
                orderBy: { featured: 'desc' },
            }),
        ]);

        // Normalize results into a unified format
        const results = [
            ...products.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: p.price,
                image: p.images[0] || null,
                type: p.productType?.toLowerCase() || 'product',
                href: `/product/${p.slug}`,
            })),
            ...combos.map(c => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                price: c.price,
                image: c.images[0] || null,
                type: 'combo',
                href: `/combos/${c.slug}`,
            })),
            ...hampers.map(h => ({
                id: h.id,
                name: h.name,
                slug: h.slug,
                price: h.price,
                image: h.images[0] || null,
                type: 'hamper',
                href: `/gift-hampers/${h.slug}`,
            })),
        ].slice(0, limit);

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        );
    }
}
