import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import PotsClient from './PotsClient';

export const metadata: Metadata = {
    title: 'Pots & Planters — Buy Ceramic, Terracotta & More Online',
    description: 'Shop beautiful handcrafted pots and planters. Ceramic, terracotta, cement and metal planters for your indoor and outdoor plants. Shop now at Vanam Store.',
    openGraph: {
        title: 'Pots & Planters — Vanam Store',
        description: 'Beautiful handcrafted pots to complement your plants.',
    },
};

export const revalidate = 120;

function serializeProduct(p: Record<string, unknown>) {
    return {
        id: p.id as string,
        name: p.name as string,
        slug: p.slug as string,
        type: (p.productType as string) || undefined,
        size: (p.size as string) || undefined,
        color: (p.color as string) || undefined,
        material: (p.material as string) || undefined,
        price: p.price as number,
        comparePrice: (p.comparePrice as number) || undefined,
        stock: p.stock as number,
        images: p.images as string[],
        featured: (p.featured as boolean) || false,
        sizeVariants: (p.sizeVariants as Array<{ size: string; price: number; stock: number; colors: Array<{ name: string; hex: string; images: string[] }> }>) || [],
        tags: (p.tags as string[]) || [],
    };
}

export default async function PotsPage() {
    const rawProducts = await prisma.product.findMany({
        where: { productType: 'POT', status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    const products = rawProducts.map(p => serializeProduct(p as unknown as Record<string, unknown>));

    return <PotsClient initialProducts={products} />;
}
