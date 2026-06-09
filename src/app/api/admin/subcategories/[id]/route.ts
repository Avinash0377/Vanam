import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

// PUT - Update subcategory
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            const { name, image, productType, matchTags, matchField, displayOrder, isActive } = body;

            // Build update data — only include fields that were provided
            const updateData: Record<string, unknown> = {};
            if (name !== undefined) updateData.name = name;
            if (image !== undefined) updateData.image = image || null;
            if (productType !== undefined) updateData.productType = productType;
            if (matchTags !== undefined) updateData.matchTags = matchTags;
            if (matchField !== undefined) updateData.matchField = matchField || null;
            if (displayOrder !== undefined) updateData.displayOrder = parseInt(String(displayOrder)) || 0;
            if (isActive !== undefined) updateData.isActive = isActive;

            // Update slug if name changed
            if (name) {
                updateData.slug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
            }

            const subcategory = await prisma.subcategory.update({
                where: { id },
                data: updateData,
            });

            return NextResponse.json({ message: 'Subcategory updated', subcategory });
        } catch (error) {
            console.error('Update subcategory error:', error);
            return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 });
        }
    });
}

// DELETE subcategory
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(request, async () => {
        try {
            const { id } = await params;
            await prisma.subcategory.delete({ where: { id } });
            return NextResponse.json({ message: 'Subcategory deleted' });
        } catch (error) {
            console.error('Delete subcategory error:', error);
            return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 });
        }
    });
}
