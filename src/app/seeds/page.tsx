import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import SeedsClient from './SeedsClient';

export const metadata: Metadata = {
    title: 'Seeds Collection — Buy Vegetable, Flower & Herb Seeds Online',
    description: 'Shop premium quality seeds for your garden. Vegetable, flower and herb seeds with high germination rate. Start your garden today with Vanam Store.',
    openGraph: {
        title: 'Seeds Collection — Vanam Store',
        description: 'Start your garden with our premium quality seeds.',
    },
};

export const revalidate = 120;

function serializeProduct(p: Record<string, unknown>) {
    return {
        id: p.id as string,
        name: p.name as string,
        slug: p.slug as string,
        description: (p.description as string) || undefined,
        productType: p.productType as string,
        size: (p.size as string) || undefined,
        suitableFor: (p.suitableFor as string) || undefined,
        price: p.price as number,
        comparePrice: (p.comparePrice as number) || undefined,
        stock: p.stock as number,
        images: p.images as string[],
        featured: (p.featured as boolean) || false,
        tags: (p.tags as string[]) || [],
    };
}

export default async function SeedsPage() {
    const rawProducts = await prisma.product.findMany({
        where: { productType: 'SEED', status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
    });

    const products = rawProducts.map(p => serializeProduct(p as unknown as Record<string, unknown>));

    return <SeedsClient initialProducts={products} />;
}
