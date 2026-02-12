import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single category
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        // Try to find by ID or slug
        const category = await prisma.category.findFirst({
            where: {
                OR: [
                    { id },
                    { slug: id },
                ],
            },
            include: {
                parent: true,
                children: true,
                products: {
                    where: { status: 'ACTIVE' },
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ category });

    } catch (error) {
        console.error('Get category error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch category' },
            { status: 500 }
        );
    }
}

// PUT update category (Admin only)
async function updateCategory(
    request: NextRequest,
    user: JWTPayload,
    id: string
) {
    try {
        const body = await request.json();
        const { name, description, image, parentId } = body;

        const existing = await prisma.category.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};

        if (name !== undefined) {
            updateData.name = name;
            const newSlug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            if (newSlug !== existing.slug) {
                const slugExists = await prisma.category.findFirst({
                    where: { slug: newSlug, id: { not: id } },
                });
                if (!slugExists) {
                    updateData.slug = newSlug;
                }
            }
        }

        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (parentId !== undefined) updateData.parentId = parentId || null;

        const category = await prisma.category.update({
            where: { id },
            data: updateData,
            include: {
                parent: true,
                children: true,
            },
        });

        return NextResponse.json({
            message: 'Category updated successfully',
            category,
        });

    } catch (error) {
        console.error('Update category error:', error);
        return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => updateCategory(req, user, id));
}

// DELETE category (Admin only)
async function deleteCategory(
    request: NextRequest,
    user: JWTPayload,
    id: string
) {
    try {
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: { select: { products: true } },
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        if (category._count.products > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category with products. Move or delete products first.' },
                { status: 400 }
            );
        }

        await prisma.category.delete({
            where: { id },
        });

        return NextResponse.json({
            message: 'Category deleted successfully',
        });

    } catch (error) {
        console.error('Delete category error:', error);
        return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => deleteCategory(req, user, id));
}
