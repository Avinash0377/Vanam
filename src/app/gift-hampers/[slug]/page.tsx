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
        const hamper = await prisma.giftHamper.findUnique({
            where: { slug },
            select: { name: true, description: true, images: true, price: true },
        });

        if (!hamper) {
            return { title: 'Gift Hamper Not Found' };
        }

        const title = `${hamper.name} — Gift Hamper | Vanam Store`;
        const description = hamper.description?.slice(0, 155) || `Buy ${hamper.name} gift hamper online at Vanam Store.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: hamper.images?.[0] ? [{ url: hamper.images[0], width: 800, height: 800, alt: hamper.name }] : [],
                type: 'website',
                siteName: 'Vanam Store',
            },
        };
    } catch {
        return { title: 'Vanam Store — Gift Hampers' };
    }
}

export default async function HamperDetailsPage({ params }: Props) {
    const { slug } = await params;

    const hamper = await prisma.giftHamper.findUnique({
        where: { slug, status: 'ACTIVE' },
    });

    if (!hamper) {
        notFound();
    }

    const product: ProductDetailsData = {
        id: hamper.id,
        name: hamper.name,
        slug: hamper.slug,
        description: hamper.description || undefined,
        includes: hamper.includes ? JSON.stringify(hamper.includes.map(i => i.name)) : undefined,
        price: hamper.price,
        comparePrice: hamper.comparePrice || undefined,
        images: hamper.images,
        stock: hamper.stock,
    };

    return <ProductDetails type="hamper" initialData={product} />;
}
