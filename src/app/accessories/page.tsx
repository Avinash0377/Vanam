import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import AccessoriesClient from './AccessoriesClient';

export const metadata: Metadata = {
    title: 'Garden Accessories — Tools & Plant Care Essentials',
    description: 'Shop essential garden accessories, tools and plant care products. Everything you need to nurture your garden. Free delivery available at Vanam Store.',
    openGraph: {
        title: 'Garden Accessories — Vanam Store',
        description: 'Essential tools and accessories to nurture your garden.',
    },
};

function serializeProduct(p: Record<string, unknown>) {
    return {
        id: p.id as string,
        name: p.name as string,
        slug: p.slug as string,
        description: (p.description as string) || undefined,
        productType: p.productType as string,
        price: p.price as number,
        comparePrice: (p.comparePrice as number) || undefined,
        stock: p.stock as number,
        images: p.images as string[],
        featured: (p.featured as boolean) || false,
        sizeVariants: (p.sizeVariants as Array<{ size: string; price: number; stock: number; colors: Array<{ name: string; hex: string; images: string[] }> }>) || [],
        tags: (p.tags as string[]) || [],
    };
}

export default async function AccessoriesPage() {
    const rawProducts = await prisma.product.findMany({
        where: { productType: 'ACCESSORY', status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    const products = rawProducts.map(p => serializeProduct(p as unknown as Record<string, unknown>));

    return <AccessoriesClient initialProducts={products} />;
}
