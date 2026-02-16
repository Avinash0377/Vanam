import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { ProductStatus, SuitableFor } from '@prisma/client';

// Helper function to wrap admin-only GET routes
async function getProducts(request: NextRequest, user: JWTPayload) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const type = searchParams.get('type') || '';

        const where: Record<string, unknown> = {};

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (status && Object.values(ProductStatus).includes(status as ProductStatus)) {
            where.status = status;
        }
        if (type) {
            where.productType = type;
        }
        const suitable = searchParams.get('suitable');
        if (suitable && Object.values(SuitableFor).includes(suitable as SuitableFor)) {
            where.suitableFor = suitable;
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { category: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Admin products error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// Fix 9: Use withAdmin middleware instead of inline auth check
export async function GET(request: NextRequest) {
    return withAdmin(request, getProducts);
}

// POST - Create new product
async function createProduct(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const {
            name,
            description,
            careInstructions,
            productType,
            size,
            suitableFor,
            price,
            comparePrice,
            stock,
            categoryId,
            featured,
            showOnHome,
            displayOrder,
            status,
            images,
            sizeVariants,
            tags,

        } = body;

        // Fix 8: Validate comparePrice > price
        if (comparePrice && parseFloat(comparePrice) <= parseFloat(price)) {
            return NextResponse.json(
                { error: 'Compare price must be greater than price' },
                { status: 400 }
            );
        }

        // Generate slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Check if slug exists
        const existingProduct = await prisma.product.findUnique({ where: { slug } });
        const finalSlug = existingProduct ? `${slug}-${Date.now()}` : slug;

        // Process size variants with per-size colors
        interface VariantColor {
            name: string;
            hex: string;
            image?: string;
            images?: string[];
        }
        interface SizeVariantInput {
            size: string;
            price: string;
            stock: string;
            colors?: VariantColor[];
        }

        const processedVariants = (sizeVariants || []).map((v: SizeVariantInput) => ({
            size: v.size,
            price: parseFloat(v.price) || 0,
            stock: parseInt(v.stock) || 0,
            colors: (v.colors || []).map((c: VariantColor) => ({
                name: c.name,
                hex: c.hex,
                images: c.images || (c.image ? [c.image] : [])
            }))
        }));

        // Calculate total stock and min price from variants
        let finalPrice = parseFloat(price) || 0;
        let finalStock = parseInt(stock) || 0;

        if (processedVariants.length > 0) {
            finalPrice = Math.min(...processedVariants.map((v: { price: number }) => v.price));
            finalStock = processedVariants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);
        }

        const product = await prisma.product.create({
            data: {
                name,
                slug: finalSlug,
                description,
                careInstructions,
                productType: productType || 'PLANT',
                size,
                suitableFor,
                price: finalPrice,
                comparePrice: comparePrice ? parseFloat(comparePrice) : null,
                stock: finalStock,
                categoryId: categoryId || null,
                featured: featured || false,
                showOnHome: showOnHome || false,
                displayOrder: parseInt(displayOrder) || 0,
                status: status || 'ACTIVE',
                images: images || [],
                sizeVariants: processedVariants,
                tags: tags || [],
            },
        });

        return NextResponse.json({ message: 'Product created', product }, { status: 201 });

    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}

// Fix 9: Use withAdmin middleware
export async function POST(request: NextRequest) {
    return withAdmin(request, createProduct);
}
