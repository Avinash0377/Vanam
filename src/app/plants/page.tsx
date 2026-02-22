import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import PlantsClient from './PlantsClient';

export const metadata: Metadata = {
    title: 'Plants Collection — Buy Indoor & Outdoor Plants Online',
    description: 'Browse our handpicked selection of beautiful indoor and outdoor plants. Premium quality plants delivered to your doorstep. Shop now at Vanam Store.',
    openGraph: {
        title: 'Plants Collection — Vanam Store',
        description: 'Discover our handpicked selection of beautiful plants for your home and garden.',
    },
};

// Serialize product for client component — strip Prisma internals
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
        sizeVariants: (p.sizeVariants as Array<{ size: string; price: number; stock: number; colors: Array<{ name: string; hex: string; images: string[] }> }>) || [],
        tags: (p.tags as string[]) || [],
    };
}

export default async function PlantsPage() {
    // Fetch plants directly from DB — no API roundtrip
    const rawProducts = await prisma.product.findMany({
        where: { productType: 'PLANT', status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
    });

    const products = rawProducts.map(p => serializeProduct(p as unknown as Record<string, unknown>));

    return <PlantsClient initialProducts={products} />;
}
