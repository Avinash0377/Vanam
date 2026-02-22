import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProductDetails, { ProductDetailsData } from '@/components/ProductDetails';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    try {
        const combo = await prisma.combo.findUnique({
            where: { slug },
            select: { name: true, description: true, images: true, price: true },
        });

        if (!combo) {
            return { title: 'Combo Not Found' };
        }

        const title = `${combo.name} — Buy Online | Vanam Store`;
        const description = combo.description?.slice(0, 155) || `Buy ${combo.name} combo online at Vanam Store.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: combo.images?.[0] ? [{ url: combo.images[0], width: 800, height: 800, alt: combo.name }] : [],
                type: 'website',
                siteName: 'Vanam Store',
            },
        };
    } catch {
        return { title: 'Vanam Store — Combo Packs' };
    }
}

export default async function ComboDetailsPage({ params }: Props) {
    const { slug } = await params;

    const combo = await prisma.combo.findUnique({
        where: { slug, status: 'ACTIVE' },
    });

    if (!combo) {
        notFound();
    }

    const product: ProductDetailsData = {
        id: combo.id,
        name: combo.name,
        slug: combo.slug,
        description: combo.description || undefined,
        includes: combo.includes ? JSON.stringify(combo.includes.map(i => i.name)) : undefined,
        suitableFor: combo.suitableFor || undefined,
        price: combo.price,
        comparePrice: combo.comparePrice || undefined,
        images: combo.images,
        stock: combo.stock,
    };

    return <ProductDetails type="combo" initialData={product} />;
}
