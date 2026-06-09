import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Public GET — fetch active subcategories by productType
// Used by plants/pots pages at build time (ISR)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productType = searchParams.get('productType') || '';

        const where: Record<string, unknown> = { isActive: true };
        if (productType) {
            where.productType = productType;
        }

        const subcategories = await prisma.subcategory.findMany({
            where,
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                productType: true,
                matchTags: true,
                matchField: true,
                displayOrder: true,
            },
        });

        return NextResponse.json(subcategories);
    } catch (error) {
        console.error('Public subcategories error:', error);
        return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
    }
}
