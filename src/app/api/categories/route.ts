import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// GET all categories
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeProducts = searchParams.get('includeProducts') === 'true';
        const parentOnly = searchParams.get('parentOnly') === 'true';

        const where: Record<string, unknown> = {};
        if (parentOnly) {
            where.parentId = null;
        }

        const categories = await prisma.category.findMany({
            where,
            include: {
                children: true,
                ...(includeProducts && {
                    products: {
                        where: { status: 'ACTIVE' },
                        take: 10,
                    },
                }),
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ categories });

    } catch (error) {
        console.error('Get categories error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

// POST create category (Admin only)
async function createCategory(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { name, description, image, parentId } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Category name is required' },
                { status: 400 }
            );
        }

        // Generate slug
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Check if slug exists
        const existingCategory = await prisma.category.findUnique({
            where: { slug },
        });

        if (existingCategory) {
            return NextResponse.json(
                { error: 'Category with this name already exists' },
                { status: 400 }
            );
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                description: description || null,
                image: image || null,
                parentId: parentId || null,
            },
            include: {
                parent: true,
                children: true,
            },
        });

        return NextResponse.json(
            { message: 'Category created successfully', category },
            { status: 201 }
        );

    } catch (error) {
        console.error('Create category error:', error);
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAdmin(request, createCategory);
}
