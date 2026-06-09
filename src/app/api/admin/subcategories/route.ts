import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// GET all subcategories for admin
async function getSubcategories(request: NextRequest, user: JWTPayload) {
    try {
        const { searchParams } = new URL(request.url);
        const productType = searchParams.get('productType') || '';

        const where: Record<string, unknown> = {};
        if (productType) {
            where.productType = productType;
        }

        const subcategories = await prisma.subcategory.findMany({
            where,
            orderBy: { displayOrder: 'asc' },
        });

        return NextResponse.json(subcategories);
    } catch (error) {
        console.error('Admin subcategories error:', error);
        return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getSubcategories);
}

// POST - Create new subcategory
async function createSubcategory(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { name, image, productType, matchTags, matchField, displayOrder, isActive } = body;

        if (!name || !productType) {
            return NextResponse.json(
                { error: 'Name and product type are required' },
                { status: 400 }
            );
        }

        // Generate slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Check if slug already exists
        const existing = await prisma.subcategory.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json(
                { error: 'Subcategory with this name already exists' },
                { status: 400 }
            );
        }

        const subcategory = await prisma.subcategory.create({
            data: {
                name,
                slug,
                image: image || null,
                productType,
                matchTags: matchTags || [],
                matchField: matchField || null,
                displayOrder: parseInt(displayOrder) || 0,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json({ message: 'Subcategory created', subcategory }, { status: 201 });
    } catch (error) {
        console.error('Create subcategory error:', error);
        return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return withAdmin(request, createSubcategory);
}
