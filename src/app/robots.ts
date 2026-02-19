import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin',
                '/admin/',
                '/cart',
                '/checkout',
                '/api/',
                '/order-confirmation',
                '/profile',
            ],
        },
        sitemap: 'https://vanamstore.in/sitemap.xml',
    };
}
