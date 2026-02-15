import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload, extractTokenFromHeader, verifyToken } from '@/lib/auth';

// GET single combo by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if 'id' looks like a valid MongoDB ObjectId (24 hex characters)
        const isValidObjectId = /^[a-f\d]{24}$/i.test(id);

        // Build the where clause - support both id and slug lookup
        const whereClause = isValidObjectId
            ? { OR: [{ id }, { slug: id }] }
            : { slug: id };

        // Check if requester is admin — if not, only show ACTIVE combos
        const token = extractTokenFromHeader(request.headers.get('authorization'));
        const user = token ? verifyToken(token) : null;
        const isAdmin = user?.role === 'ADMIN';

        const combo = await prisma.combo.findFirst({
            where: {
                ...whereClause,
                ...(!isAdmin && { status: 'ACTIVE' }),
            },
        });

        if (!combo) {
            return NextResponse.json(
                { error: 'Combo not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ combo });

    } catch (error) {
        console.error('Get combo error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch combo' },
            { status: 500 }
        );
    }
}

// PUT update combo (Admin only)
async function updateCombo(
    request: NextRequest,
    user: JWTPayload,
    id: string
) {
    try {
        const body = await request.json();
        const { name, description, includes, suitableFor, price, comparePrice, stock, images, featured, showOnHome, displayOrder } = body;

        const existing = await prisma.combo.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'Combo not found' },
                { status: 404 }
            );
        }

        // Validate comparePrice > price when both are provided
        const effectivePrice = price !== undefined ? parseFloat(price) : existing.price;
        const effectiveComparePrice = comparePrice !== undefined ? parseFloat(comparePrice) : existing.comparePrice;
        if (effectiveComparePrice && effectivePrice && effectiveComparePrice <= effectivePrice) {
            return NextResponse.json(
                { error: 'Compare price must be greater than price' },
                { status: 400 }
            );
        }

        // Update slug only if name changed
        let slug = existing.slug;
        if (name && name !== existing.name) {
            slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
        }

        const combo = await prisma.combo.update({
            where: { id },
            data: {
                name: name || existing.name,
                slug,
                description: description !== undefined ? description : existing.description,
                includes: includes !== undefined ? includes : existing.includes,
                suitableFor: suitableFor !== undefined ? suitableFor : existing.suitableFor,
                price: price !== undefined ? parseFloat(price) : existing.price,
                comparePrice: comparePrice !== undefined ? (comparePrice ? parseFloat(comparePrice) : null) : existing.comparePrice,
                stock: stock !== undefined ? parseInt(stock) : existing.stock,
                images: images !== undefined ? images : existing.images,
                featured: featured !== undefined ? featured : existing.featured,
                showOnHome: showOnHome !== undefined ? showOnHome : existing.showOnHome,
                displayOrder: displayOrder !== undefined ? parseInt(displayOrder) || 0 : existing.displayOrder,
            },
        });

        return NextResponse.json({ message: 'Combo updated', combo });

    } catch (error) {
        console.error('Update combo error:', error);
        return NextResponse.json({ error: 'Failed to update combo' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => updateCombo(req, user, id));
}

// DELETE combo (Admin only)
async function deleteCombo(
    request: NextRequest,
    user: JWTPayload,
    id: string
) {
    try {
        const existing = await prisma.combo.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'Combo not found' },
                { status: 404 }
            );
        }

        await prisma.combo.delete({ where: { id } });

        return NextResponse.json({ message: 'Combo deleted' });

    } catch (error) {
        console.error('Delete combo error:', error);
        return NextResponse.json({ error: 'Failed to delete combo' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => deleteCombo(req, user, id));
}
