import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload, verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { ProductStatus } from '@prisma/client';

// GET all gift hampers (public: only active, admin with ?all=true: all)
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
            // Admin can see all hampers (no status filter)
        } else {
            // Public requests only get active hampers
            where.status = ProductStatus.ACTIVE;
        }

        if (featured === 'true') where.featured = true;

        const hampers = await prisma.giftHamper.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ hampers });

    } catch (error) {
        console.error('Get hampers error:', error);
        return NextResponse.json({ error: 'Failed to fetch hampers' }, { status: 500 });
    }
}

// POST create hamper (Admin only)
async function createHamper(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { name, description, includes, giftWrap, messageCard, price, comparePrice, stock, images, featured, showOnHome, displayOrder, status } = body;

        if (!name || !includes || !price) {
            return NextResponse.json(
                { error: 'Name, includes, and price are required' },
                { status: 400 }
            );
        }

        // Fix 8: Validate comparePrice > price
        if (comparePrice && parseFloat(comparePrice) <= parseFloat(price)) {
            return NextResponse.json(
                { error: 'Compare price must be greater than price' },
                { status: 400 }
            );
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const hamper = await prisma.giftHamper.create({
            data: {
                name,
                slug: `${slug}-${Date.now()}`,
                description: description || null,
                includes,
                giftWrap: giftWrap !== false,
                messageCard: messageCard !== false,
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

        return NextResponse.json({ message: 'Gift hamper created', hamper }, { status: 201 });

    } catch (error) {
        console.error('Create hamper error:', error);
        return NextResponse.json({ error: 'Failed to create hamper' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return withAdmin(request, createHamper);
}
