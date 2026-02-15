import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

// GET single product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(request, async () => {
        try {
            const { id } = await params;

            const product = await prisma.product.findUnique({
                where: { id },
                include: { category: true },
            });

            if (!product) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }

            return NextResponse.json(product);
        } catch (error) {
            console.error('Get product error:', error);
            return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
        }
    });
}

// PUT - Update product
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(request, async () => {
        try {
            const { id } = await params;

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

            } = body;

            // Fetch existing product for partial update context
            const existing = await prisma.product.findUnique({ where: { id } });
            if (!existing) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }

            // Validate comparePrice > price (considering partial updates)
            const effectivePrice = price !== undefined ? parseFloat(price) : existing.price;
            const effectiveComparePrice = comparePrice !== undefined ? (comparePrice ? parseFloat(comparePrice) : null) : existing.comparePrice;
            if (effectiveComparePrice && effectivePrice && effectiveComparePrice <= effectivePrice) {
                return NextResponse.json(
                    { error: 'Compare price must be greater than price' },
                    { status: 400 }
                );
            }

            // Process size variants with per-size colors
            interface VariantColor {
                name: string;
                hex: string;
                image?: string;
                images?: string[];
            }
            interface SizeVariantInput {
                size: string;
                price: string | number;
                stock: string | number;
                colors?: VariantColor[];
            }

            const processedVariants = (sizeVariants || []).map((v: SizeVariantInput) => ({
                size: v.size,
                price: typeof v.price === 'number' ? v.price : (parseFloat(v.price) || 0),
                stock: typeof v.stock === 'number' ? v.stock : (parseInt(v.stock) || 0),
                colors: (v.colors || []).map((c: VariantColor) => ({
                    name: c.name,
                    hex: c.hex,
                    images: c.images || (c.image ? [c.image] : [])
                }))
            }));

            // Calculate total stock and min price from variants
            let finalPrice = price ? parseFloat(price) : undefined;
            let finalStock = stock !== undefined ? parseInt(stock) : undefined;

            if (processedVariants.length > 0) {
                finalPrice = Math.min(...processedVariants.map((v: { price: number }) => v.price));
                finalStock = processedVariants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);
            }

            const product = await prisma.product.update({
                where: { id },
                data: {
                    name,
                    description,
                    careInstructions,
                    productType,
                    size,
                    suitableFor,
                    price: finalPrice,
                    comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
                    stock: finalStock,
                    categoryId: categoryId || undefined,
                    featured,
                    showOnHome,
                    displayOrder: displayOrder !== undefined ? parseInt(displayOrder) || 0 : undefined,
                    status,
                    images,
                    sizeVariants: sizeVariants !== undefined ? processedVariants : undefined,
                    tags: body.tags || undefined,

                },
            });

            return NextResponse.json({ message: 'Product updated', product });
        } catch (error) {
            console.error('Update product error:', error);
            return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
        }
    });
}

// DELETE product
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(request, async () => {
        try {
            const { id } = await params;
            await prisma.product.delete({ where: { id } });
            return NextResponse.json({ message: 'Product deleted' });
        } catch (error) {
            console.error('Delete product error:', error);
            return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
        }
    });
}
