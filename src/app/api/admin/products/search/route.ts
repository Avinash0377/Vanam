/**
 * GET /api/admin/products/search?q=money+plant
 *
 * Lightweight product search for the admin coupon form's product multi-select.
 * Returns id, name, thumbnail, category, price — max 20 results.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

async function searchProducts(request: NextRequest, _user: JWTPayload) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.trim() || '';

        if (!query || query.length < 2) {
            return NextResponse.json({ products: [] });
        }

        const products = await prisma.product.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' },
                status: { not: 'DRAFT' },
            },
            select: {
                id: true,
                name: true,
                images: true,
                price: true,
                productType: true,
                category: { select: { name: true } },
            },
            orderBy: { name: 'asc' },
            take: 20,
        });

        // Map to lightweight response
        const results = products.map(p => ({
            id: p.id,
            name: p.name,
            thumbnail: p.images?.[0] || null,
            price: p.price,
            productType: p.productType,
            category: p.category?.name || null,
        }));

        return NextResponse.json({ products: results });
    } catch (error) {
        console.error('Admin product search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, searchProducts);
}
