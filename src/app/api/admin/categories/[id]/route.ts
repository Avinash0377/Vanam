import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

// PUT - Update category
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();
            const { name, description, image, parentId } = body;

            const category = await prisma.category.update({
                where: { id },
                data: {
                    name,
                    description,
                    image,
                    featured: body.featured !== undefined ? body.featured : undefined,
                    parentId: parentId || null,
                },
            });

            return NextResponse.json({ message: 'Category updated', category });
        } catch (error) {
            console.error('Update category error:', error);
            return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
        }
    });
}

// DELETE category
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(request, async () => {
        try {
            const { id } = await params;

            // Check if category has products
            const productCount = await prisma.product.count({ where: { categoryId: id } });
            if (productCount > 0) {
                return NextResponse.json(
                    { error: `Cannot delete category with ${productCount} products. Remove products first.` },
                    { status: 400 }
                );
            }

            await prisma.category.delete({ where: { id } });
            return NextResponse.json({ message: 'Category deleted' });
        } catch (error) {
            console.error('Delete category error:', error);
            return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
        }
    });
}
