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
            interface PlanterInput {
                name: string;
                price: string | number;
                comparePrice?: string | number | null;
                stock: string | number;
                icon?: string;
                colors?: VariantColor[];
            }
            interface SizeVariantInput {
                size: string;
                price: string | number;
                comparePrice?: string | number | null;
                stock: string | number;
                colors?: VariantColor[];
                planters?: PlanterInput[];
            }

            const toNum = (val: string | number | null | undefined): number =>
                typeof val === 'number' ? val : (parseFloat(val as string) || 0);
            const mapColors = (colors?: VariantColor[]) =>
                (colors || []).map((c: VariantColor) => ({
                    name: c.name,
                    hex: c.hex,
                    images: c.images || (c.image ? [c.image] : [])
                }));

            const processedVariants = (sizeVariants || []).map((v: SizeVariantInput) => {
                const price = toNum(v.price);
                const cp = v.comparePrice ? toNum(v.comparePrice) : null;

                if (cp !== null && cp <= price) {
                    throw new Error(`Compare price for size ${v.size} must be greater than its selling price`);
                }

                const planters = (v.planters || []).map((p: PlanterInput) => {
                    const pPrice = toNum(p.price);
                    const pCp = p.comparePrice ? toNum(p.comparePrice) : null;
                    if (pCp !== null && pCp <= pPrice) {
                        throw new Error(`Compare price for planter ${p.name} (size ${v.size}) must be greater than its selling price`);
                    }
                    return {
                        name: p.name,
                        price: pPrice,
                        comparePrice: pCp,
                        stock: typeof p.stock === 'number' ? p.stock : (parseInt(p.stock as string) || 0),
                        icon: p.icon || null,
                        colors: mapColors(p.colors),
                    };
                });

                return {
                    size: v.size,
                    price,
                    comparePrice: cp,
                    stock: typeof v.stock === 'number' ? v.stock : (parseInt(v.stock as string) || 0),
                    colors: mapColors(v.colors),
                    planters,
                };
            });

            // Calculate total stock and min price from variants
            let finalPrice = price ? parseFloat(price) : undefined;
            let finalStock = stock !== undefined ? parseInt(stock) : undefined;

            if (processedVariants.length > 0) {
                // When planters exist, price/stock derive from the planters (they set the final price)
                const variantPrices: number[] = [];
                let variantStock = 0;
                for (const v of processedVariants as { price: number; stock: number; planters: { price: number; stock: number }[] }[]) {
                    if (v.planters && v.planters.length > 0) {
                        for (const p of v.planters) {
                            variantPrices.push(p.price);
                            variantStock += p.stock;
                        }
                    } else {
                        variantPrices.push(v.price);
                        variantStock += v.stock;
                    }
                }
                if (variantPrices.length > 0) {
                    finalPrice = Math.min(...variantPrices);
                }
                finalStock = variantStock;
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
        } catch (error: any) {
            console.error('Update product error:', error);
            return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
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
