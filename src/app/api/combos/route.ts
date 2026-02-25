import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload, verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { ProductStatus } from '@prisma/client';

// GET all combos (public: only active, admin with ?all=true: all)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const featured = searchParams.get('featured');
        const all = searchParams.get('all');

        const where: Record<string, unknown> = {};

        // Fix 5: Admin-only query protection
        if (all === 'true') {
            // Verify admin token for ?all=true
            const token = extractTokenFromHeader(request.headers.get('authorization'));
            if (!token) {
                return NextResponse.json({ error: 'Admin authentication required for this query' }, { status: 401 });
            }
            const payload = verifyToken(token);
            if (!payload || payload.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
            }
            // Admin can see all combos (no status filter)
        } else {
            // Public requests only get active combos
            where.status = ProductStatus.ACTIVE;
        }

        if (featured === 'true') where.featured = true;

        const combos = await prisma.combo.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ combos });

    } catch (error) {
        console.error('Get combos error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch combos' },
            { status: 500 }
        );
    }
}

// POST create combo (Admin only)
async function createCombo(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { name, description, includes, suitableFor, price, comparePrice, stock, images, featured, showOnHome, displayOrder, status } = body;

        if (!name || !includes || !price) {
            return NextResponse.json(
                { error: 'Name, includes, and price are required' },
                { status: 400 }
            );
        }

        const parsedPrice = parseFloat(price);
        const parsedComparePrice = comparePrice ? parseFloat(comparePrice) : null;

        // Validate comparePrice > price
        if (parsedComparePrice !== null && parsedComparePrice <= parsedPrice) {
            return NextResponse.json(
                { error: 'Compare price must be greater than price' },
                { status: 400 }
            );
        }

        // Convert plain string to IncludedItem[] for the schema
        const includesArray = typeof includes === 'string'
            ? includes.split(',').map((item: string) => ({ name: item.trim(), quantity: 1, image: null })).filter((item: { name: string }) => item.name)
            : includes;

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check if slug exists before appending timestamp
        const existingCombo = await prisma.combo.findUnique({ where: { slug } });
        const finalSlug = existingCombo ? `${slug}-${Date.now()}` : slug;

        const combo = await prisma.combo.create({
            data: {
                name,
                slug: finalSlug,
                description: description || null,
                includes: includesArray,
                suitableFor: suitableFor || null,
                price: parseFloat(price),
                comparePrice: comparePrice ? parseFloat(comparePrice) : null,
                stock: parseInt(stock) || 0,
                images: images || [],
                featured: featured || false,
                showOnHome: showOnHome || false,
                displayOrder: parseInt(displayOrder) || 0,
                status: status || ProductStatus.ACTIVE,
            },
        });

        return NextResponse.json({ message: 'Combo created', combo }, { status: 201 });

    } catch (error) {
        console.error('Create combo error:', error);
        return NextResponse.json({ error: 'Failed to create combo' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return withAdmin(request, createCombo);
}
