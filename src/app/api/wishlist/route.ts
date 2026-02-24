import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { ProductStatus } from '@prisma/client';

// GET user's wishlist
async function getWishlist(request: NextRequest, user: JWTPayload) {
    try {
        const wishlistItems = await prisma.wishlist.findMany({
            where: { userId: user.userId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        comparePrice: true,
                        images: true,
                        stock: true,
                        status: true,
                        productType: true,
                        suitableFor: true,
                        featured: true,
                        tags: true,
                        sizeVariants: true,
                        category: {
                            select: { name: true, slug: true },
                        },
                    },
                },
                combo: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        comparePrice: true,
                        images: true,
                        stock: true,
                        status: true,
                        featured: true,
                    },
                },
                hamper: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        comparePrice: true,
                        images: true,
                        stock: true,
                        status: true,
                        featured: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ wishlist: wishlistItems });

    } catch (error) {
        console.error('Get wishlist error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch wishlist' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return withAuth(request, getWishlist);
}

// POST toggle wishlist item (add if not exists, remove if exists)
async function toggleWishlist(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { productId, comboId, hamperId } = body;

        if (!productId && !comboId && !hamperId) {
            return NextResponse.json(
                { error: 'Product ID, Combo ID, or Hamper ID is required' },
                { status: 400 }
            );
        }

        // Build the unique filter
        const where = productId
            ? { userId_productId: { userId: user.userId, productId } }
            : comboId
                ? { userId_comboId: { userId: user.userId, comboId } }
                : { userId_hamperId: { userId: user.userId, hamperId: hamperId! } };

        // Check if already wishlisted
        const existing = await prisma.wishlist.findUnique({ where });

        if (existing) {
            // Remove from wishlist (toggle off)
            await prisma.wishlist.delete({ where: { id: existing.id } });
            return NextResponse.json({ added: false, message: 'Removed from wishlist' });
        }

        // Validate item exists and is ACTIVE before adding
        if (productId) {
            const product = await prisma.product.findUnique({ where: { id: productId } });
            if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            if (product.status !== ProductStatus.ACTIVE) {
                return NextResponse.json({ error: 'Product is not available' }, { status: 400 });
            }
        } else if (comboId) {
            const combo = await prisma.combo.findUnique({ where: { id: comboId } });
            if (!combo) return NextResponse.json({ error: 'Combo not found' }, { status: 404 });
            if (combo.status !== ProductStatus.ACTIVE) {
                return NextResponse.json({ error: 'Combo is not available' }, { status: 400 });
            }
        } else if (hamperId) {
            const hamper = await prisma.giftHamper.findUnique({ where: { id: hamperId } });
            if (!hamper) return NextResponse.json({ error: 'Hamper not found' }, { status: 404 });
            if (hamper.status !== ProductStatus.ACTIVE) {
                return NextResponse.json({ error: 'Gift hamper is not available' }, { status: 400 });
            }
        }

        // Add to wishlist
        await prisma.wishlist.create({
            data: {
                userId: user.userId,
                productId: productId || undefined,
                comboId: comboId || undefined,
                hamperId: hamperId || undefined,
            },
        });

        return NextResponse.json({ added: true, message: 'Added to wishlist' });

    } catch (error) {
        console.error('Toggle wishlist error:', error);
        return NextResponse.json(
            { error: 'Failed to update wishlist' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAuth(request, toggleWishlist);
}

// DELETE remove specific item from wishlist
async function removeFromWishlist(request: NextRequest, user: JWTPayload) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Wishlist item ID is required' },
                { status: 400 }
            );
        }

        // Verify ownership before deleting
        const item = await prisma.wishlist.findFirst({
            where: { id, userId: user.userId },
        });

        if (!item) {
            return NextResponse.json(
                { error: 'Wishlist item not found' },
                { status: 404 }
            );
        }

        await prisma.wishlist.delete({ where: { id } });

        return NextResponse.json({ message: 'Removed from wishlist' });

    } catch (error) {
        console.error('Remove from wishlist error:', error);
        return NextResponse.json(
            { error: 'Failed to remove from wishlist' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    return withAuth(request, removeFromWishlist);
}
