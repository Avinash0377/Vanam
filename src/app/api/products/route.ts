import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { ProductType, ProductStatus, ProductSize, SuitableFor } from '@prisma/client';

// GET all products with filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12') || 12));
        const categoryId = searchParams.get('categoryId');
        const productType = searchParams.get('productType');
        const size = searchParams.get('size');
        const suitableFor = searchParams.get('suitableFor');
        const featured = searchParams.get('featured');
        const search = searchParams.get('search');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

        // Whitelist allowed sort fields to prevent data leakage
        const allowedSortFields = ['createdAt', 'price', 'name', 'stock', 'featured'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

        // Build where clause
        const where: Record<string, unknown> = {
            status: ProductStatus.ACTIVE,
        };

        if (categoryId) where.categoryId = categoryId;
        // Cast string to enum for Prisma
        if (productType && Object.values(ProductType).includes(productType as ProductType)) {
            where.productType = productType as ProductType;
        }
        if (size && Object.values(ProductSize).includes(size as ProductSize)) {
            where.size = size as ProductSize;
        }
        if (suitableFor && Object.values(SuitableFor).includes(suitableFor as SuitableFor)) {
            where.suitableFor = suitableFor as SuitableFor;
        }
        if (featured === 'true') where.featured = true;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
            if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get products and total count
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
                orderBy: {
                    [safeSortBy]: safeSortOrder,
                },
                skip,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Get products error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

// POST create new product (Admin only)
async function createProduct(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const {
            name,
            categoryId,
            productType = 'PLANT',
            size,
            suitableFor,
            description,
            careInstructions,
            price,
            comparePrice,
            stock,
            images,
            featured,
        } = body;

        // Validation
        if (!name || !price) {
            return NextResponse.json(
                { error: 'Name and price are required' },
                { status: 400 }
            );
        }

        // Generate slug
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Check if slug exists
        const existingProduct = await prisma.product.findUnique({
            where: { slug },
        });

        const finalSlug = existingProduct
            ? `${slug}-${Date.now()}`
            : slug;

        const product = await prisma.product.create({
            data: {
                name,
                slug: finalSlug,
                categoryId: categoryId || null,
                productType,
                size: size || null,
                suitableFor: suitableFor || null,
                description: description || null,
                careInstructions: careInstructions || null,
                price: parseFloat(price),
                comparePrice: comparePrice ? parseFloat(comparePrice) : null,
                stock: parseInt(stock) || 0,
                images: images || [],
                featured: featured || false,
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json(
            { message: 'Product created successfully', product },
            { status: 201 }
        );

    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAdmin(request, createProduct);
}
