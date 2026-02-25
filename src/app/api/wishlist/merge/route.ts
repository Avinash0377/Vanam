import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// PUT /api/wishlist/merge — bulk-merge guest wishlist items on login
// Replaces N sequential POST /api/wishlist calls with a single request
async function mergeGuestWishlist(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { items } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ message: 'Nothing to merge' });
        }

        // Cap at 50 items to prevent abuse
        const safeItems = items.slice(0, 50);

        let added = 0;
        let skipped = 0;

        // Process all items: check existence + create in parallel batches
        const mergePromises = safeItems.map(async (item: { productId?: string; comboId?: string; hamperId?: string }) => {
            try {
                const { productId, comboId, hamperId } = item;
                if (!productId && !comboId && !hamperId) return;

                // Check if already in wishlist using unique compound index
                const where = productId
                    ? { userId_productId: { userId: user.userId, productId } }
                    : comboId
                        ? { userId_comboId: { userId: user.userId, comboId } }
                        : { userId_hamperId: { userId: user.userId, hamperId: hamperId! } };

                const existing = await prisma.wishlist.findUnique({ where });
                if (existing) {
                    skipped++;
                    return;
                }

                // Create wishlist entry (upsert-like, skip if duplicate)
                await prisma.wishlist.create({
                    data: {
                        userId: user.userId,
                        productId: productId || undefined,
                        comboId: comboId || undefined,
                        hamperId: hamperId || undefined,
                    },
                });
                added++;
            } catch {
                // Skip individual item failures (e.g., duplicate key race condition)
                skipped++;
            }
        });

        await Promise.all(mergePromises);

        return NextResponse.json({
            message: 'Wishlist merged successfully',
            added,
            skipped,
        });

    } catch (error) {
        console.error('Merge wishlist error:', error);
        return NextResponse.json(
            { error: 'Failed to merge wishlist' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    return withAuth(request, mergeGuestWishlist);
}
