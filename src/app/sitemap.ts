import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://vanamstore.in';
    const currentDate = new Date().toISOString();

    // Static pages
    const staticPages = [
        '',
        '/plants',
        '/pots',
        '/accessories',
        '/seeds',
        '/combos',
        '/gift-hampers',
        '/about',
        '/contact',
        '/shipping',
        '/returns',
        '/faq',
        '/privacy',
        '/terms',
        '/login',
    ];

    const staticSitemap: MetadataRoute.Sitemap = staticPages.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: currentDate,
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : route.startsWith('/plants') || route.startsWith('/pots') ? 0.9 : 0.7,
    }));

    // Dynamic product pages
    try {
        const [products, combos, hampers] = await Promise.all([
            prisma.product.findMany({
                where: { status: 'ACTIVE' },
                select: { slug: true, productType: true, updatedAt: true },
            }),
            prisma.combo.findMany({
                where: { status: 'ACTIVE' },
                select: { slug: true, updatedAt: true },
            }),
            prisma.giftHamper.findMany({
                where: { status: 'ACTIVE' },
                select: { slug: true, updatedAt: true },
            }),
        ]);

        // Map product type to URL prefix
        const typeToPath: Record<string, string> = {
            PLANT: '/plants',
            POT: '/pots',
            SEED: '/seeds',
            PLANTER: '/pots',
            ACCESSORY: '/accessories',
        };

        const productSitemap: MetadataRoute.Sitemap = products.map((p) => ({
            url: `${baseUrl}${typeToPath[p.productType] || '/plants'}/${p.slug}`,
            lastModified: p.updatedAt.toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

        const comboSitemap: MetadataRoute.Sitemap = combos.map((c) => ({
            url: `${baseUrl}/combos/${c.slug}`,
            lastModified: c.updatedAt.toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

        const hamperSitemap: MetadataRoute.Sitemap = hampers.map((h) => ({
            url: `${baseUrl}/gift-hampers/${h.slug}`,
            lastModified: h.updatedAt.toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

        return [...staticSitemap, ...productSitemap, ...comboSitemap, ...hamperSitemap];
    } catch (error) {
        console.error('Sitemap generation error:', error);
        return staticSitemap;
    }
}
