import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// GET all categories for admin
async function getCategories(request: NextRequest, user: JWTPayload) {
    try {

        const categories = await prisma.category.findMany({
            include: {
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(categories);


    } catch (error) {
        console.error('Admin categories error:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getCategories);
}

// POST - Create new category
async function createCategory(request: NextRequest, user: JWTPayload) {
    try {

        const body = await request.json();
        const { name, description, image, parentId } = body;

        // Generate slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Check if slug exists
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                description,
                image,
                featured: body.featured || false,
                parentId: parentId || null,
            },
        });

        return NextResponse.json({ message: 'Category created', category }, { status: 201 });


    } catch (error) {
        console.error('Create category error:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return withAdmin(request, createCategory);
}
