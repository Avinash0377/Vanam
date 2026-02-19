import { Metadata } from 'next';
import prisma from '@/lib/prisma';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    try {
        const product = await prisma.product.findUnique({
            where: { slug },
            select: {
                name: true,
                description: true,
                images: true,
                category: { select: { name: true } },
                price: true,
                productType: true,
            },
        });

        if (!product) {
            return {
                title: 'Product Not Found',
                description: 'The product you are looking for does not exist.',
            };
        }

        const categoryName = product.category?.name || product.productType;
        const title = `${product.name} — Buy Online | Vanam Store`;
        const description =
            product.description?.slice(0, 155) ||
            `Buy ${product.name} online at Vanam Store. Premium quality ${categoryName}. Free delivery available.`;

        const image = product.images?.[0] || '/og-image.jpg';

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [
                    {
                        url: image,
                        width: 800,
                        height: 800,
                        alt: product.name,
                    },
                ],
                type: 'website',
                siteName: 'Vanam Store',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [image],
            },
        };
    } catch {
        return {
            title: 'Vanam Store — Online Plant Nursery',
        };
    }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
