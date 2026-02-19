import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload, extractTokenFromHeader, verifyToken } from '@/lib/auth';

// GET single hamper by ID
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

        // Check if requester is admin — if not, only show ACTIVE hampers
        const token = extractTokenFromHeader(request.headers.get('authorization'));
        const user = token ? verifyToken(token) : null;
        const isAdmin = user?.role === 'ADMIN';

        const hamper = await prisma.giftHamper.findFirst({
            where: {
                ...whereClause,
                ...(!isAdmin && { status: 'ACTIVE' }),
            },
        });

        if (!hamper) {
            return NextResponse.json(
                { error: 'Gift hamper not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ hamper });

    } catch (error) {
        console.error('Get hamper error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch gift hamper' },
            { status: 500 }
        );
    }
}

// PUT update hamper (Admin only)
async function updateHamper(
    request: NextRequest,
    _user: JWTPayload,
    id: string
) {
    try {
        const body = await request.json();
        const { name, description, includes, giftWrap, messageCard, price, comparePrice, stock, images, featured, showOnHome, displayOrder } = body;

        const existing = await prisma.giftHamper.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'Gift hamper not found' },
                { status: 404 }
            );
        }

        // Validate comparePrice > price when both are provided
        const effectivePrice = price !== undefined ? parseFloat(price) : existing.price;
        const effectiveComparePrice = comparePrice !== undefined
            ? (comparePrice ? parseFloat(comparePrice) : null)
            : existing.comparePrice;
        if (effectiveComparePrice !== null && effectivePrice && effectiveComparePrice <= effectivePrice) {
            return NextResponse.json(
                { error: 'Compare price must be greater than price' },
                { status: 400 }
            );
        }

        // Convert includes string to IncludedItem[] if needed
        const resolvedIncludes = includes !== undefined
            ? (typeof includes === 'string'
                ? includes.split(',').map((item: string) => ({ name: item.trim(), quantity: 1, image: null })).filter((item: { name: string }) => item.name)
                : includes)
            : existing.includes;

        // Update slug only if name changed
        let slug = existing.slug;
        if (name && name !== existing.name) {
            slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
        }

        const hamper = await prisma.giftHamper.update({
            where: { id },
            data: {
                name: name || existing.name,
                slug,
                description: description !== undefined ? description : existing.description,
                includes: resolvedIncludes,
                giftWrap: giftWrap !== undefined ? giftWrap : existing.giftWrap,
                messageCard: messageCard !== undefined ? messageCard : existing.messageCard,
                price: price !== undefined ? parseFloat(price) : existing.price,
                comparePrice: comparePrice !== undefined ? (comparePrice ? parseFloat(comparePrice) : null) : existing.comparePrice,
                stock: stock !== undefined ? parseInt(stock) : existing.stock,
                images: images !== undefined ? images : existing.images,
                featured: featured !== undefined ? featured : existing.featured,
                showOnHome: showOnHome !== undefined ? showOnHome : existing.showOnHome,
                displayOrder: displayOrder !== undefined ? parseInt(displayOrder) || 0 : existing.displayOrder,
            },
        });

        return NextResponse.json({ message: 'Gift hamper updated', hamper });

    } catch (error) {
        console.error('Update hamper error:', error);
        return NextResponse.json({ error: 'Failed to update gift hamper' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => updateHamper(req, user, id));
}

// DELETE hamper (Admin only)
async function deleteHamper(
    request: NextRequest,
    _user: JWTPayload,
    id: string
) {
    try {
        const existing = await prisma.giftHamper.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'Gift hamper not found' },
                { status: 404 }
            );
        }

        await prisma.giftHamper.delete({ where: { id } });

        return NextResponse.json({ message: 'Gift hamper deleted' });

    } catch (error) {
        console.error('Delete hamper error:', error);
        return NextResponse.json({ error: 'Failed to delete gift hamper' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => deleteHamper(req, user, id));
}
