import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload, extractTokenFromHeader, verifyToken } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single product
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        // Check if 'id' looks like a valid MongoDB ObjectId (24 hex characters)
        const isValidObjectId = /^[a-f\d]{24}$/i.test(id);

        // Build the where clause - only include id lookup if it's a valid ObjectId
        const whereClause = isValidObjectId
            ? { OR: [{ id }, { slug: id }] }
            : { slug: id };

        // Check if requester is admin — if not, only show ACTIVE products
        const token = extractTokenFromHeader(request.headers.get('authorization'));
        const user = token ? verifyToken(token) : null;
        const isAdmin = user?.role === 'ADMIN';

        const product = await prisma.product.findFirst({
            where: {
                ...whereClause,
                ...(!isAdmin && { status: 'ACTIVE' }),
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ product });

    } catch (error) {
        console.error('Get product error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}

// PUT update product (Admin only)
async function updateProduct(
    request: NextRequest,
    user: JWTPayload,
    id: string
) {
    try {
        const body = await request.json();
        const {
            name,
            categoryId,
            productType,
            size,
            suitableFor,
            description,
            careInstructions,
            price,
            comparePrice,
            stock,
            images,
            featured,
            status,
            // Variant fields
            sizeVariants,

        } = body;

        // Check if product exists
        const existing = await prisma.product.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: Record<string, unknown> = {};

        if (name !== undefined) {
            updateData.name = name;
            // Update slug if name changes
            const newSlug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            if (newSlug !== existing.slug) {
                const slugExists = await prisma.product.findFirst({
                    where: { slug: newSlug, id: { not: id } },
                });
                updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
            }
        }

        if (categoryId !== undefined) updateData.categoryId = categoryId || null;
        if (productType !== undefined) updateData.productType = productType;
        if (size !== undefined) updateData.size = size;
        if (suitableFor !== undefined) updateData.suitableFor = suitableFor;
        if (description !== undefined) updateData.description = description;
        if (careInstructions !== undefined) updateData.careInstructions = careInstructions;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
        if (stock !== undefined) updateData.stock = parseInt(stock);
        if (images !== undefined) updateData.images = images;
        if (featured !== undefined) updateData.featured = featured;
        if (status !== undefined) updateData.status = status;

        // Process variant fields with per-size colors
        if (sizeVariants !== undefined) {
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

            const processedVariants = sizeVariants.map((v: SizeVariantInput) => ({
                size: v.size,
                price: parseFloat(v.price) || 0,
                stock: parseInt(v.stock) || 0,
                colors: (v.colors || []).map((c: VariantColor) => ({
                    name: c.name,
                    hex: c.hex,
                    images: c.images || (c.image ? [c.image] : [])
                }))
            }));
            updateData.sizeVariants = processedVariants;
            // Recalculate price and stock from variants
            if (processedVariants.length > 0) {
                updateData.price = Math.min(...processedVariants.map((v: { price: number }) => v.price));
                updateData.stock = processedVariants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);
            }
        }


        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
            },
        });

        return NextResponse.json({
            message: 'Product updated successfully',
            product,
        });

    } catch (error) {
        console.error('Update product error:', error);
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => updateProduct(req, user, id));
}

// DELETE product (Admin only)
async function deleteProduct(
    request: NextRequest,
    user: JWTPayload,
    id: string
) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Check if this product has ever been ordered — if so, block deletion
        // to preserve order history integrity
        const orderCount = await prisma.orderItem.count({
            where: { productId: id },
        });

        if (orderCount > 0) {
            return NextResponse.json(
                {
                    error: `Cannot delete "${product.name}" — it appears in ${orderCount} order(s). Set its status to DRAFT or OUT_OF_STOCK instead.`,
                    canArchive: true,
                },
                { status: 409 }
            );
        }

        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({
            message: 'Product deleted successfully',
        });

    } catch (error) {
        console.error('Delete product error:', error);
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => deleteProduct(req, user, id));
}
