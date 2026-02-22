import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProductClient, { ProductData } from './ProductClient';
import RelatedProducts from '@/components/RelatedProducts';
import styles from './page.module.css';

// ── Types ──────────────────────────────────────────────

interface Props {
    params: Promise<{ slug: string }>;
}

// ── SEO Metadata (Server-Side) ─────────────────────────

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

// ── Server Component (SSR) ─────────────────────────────

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;

    // Fetch product data directly from DB — no API roundtrip
    const rawProduct = await prisma.product.findUnique({
        where: { slug, status: 'ACTIVE' },
        include: {
            category: {
                select: { name: true, slug: true },
            },
        },
    });

    if (!rawProduct) {
        notFound();
    }

    // Serialize for the client component (strip Prisma internals, convert Dates)
    const product: ProductData = {
        id: rawProduct.id,
        name: rawProduct.name,
        slug: rawProduct.slug,
        description: rawProduct.description || undefined,
        careInstructions: rawProduct.careInstructions || undefined,
        productType: rawProduct.productType,
        size: rawProduct.size || undefined,
        suitableFor: rawProduct.suitableFor || undefined,
        price: rawProduct.price,
        comparePrice: rawProduct.comparePrice || undefined,
        images: rawProduct.images,
        stock: rawProduct.stock,
        category: rawProduct.category
            ? { name: rawProduct.category.name, slug: rawProduct.category.slug }
            : undefined,
        sizeVariants: (rawProduct.sizeVariants as ProductData['sizeVariants']) || undefined,
    };

    return (
        <div className={styles.page}>
            <div className="container">
                <ProductClient product={product} />
            </div>

            <RelatedProducts
                categorySlug={product.category?.slug}
                currentId={product.id}
            />
        </div>
    );
}
