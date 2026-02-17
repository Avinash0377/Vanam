import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Public GET — active banners sorted by displayOrder
export async function GET() {
    try {
        const banners = await prisma.banner.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
        });

        return NextResponse.json({ banners }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Failed to fetch banners:', error);
        return NextResponse.json({ banners: [] });
    }
}
