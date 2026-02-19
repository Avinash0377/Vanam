import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import WhatsAppButton from '@/components/WhatsAppButton';

export const metadata: Metadata = {
    title: {
        default: 'Vanam Store - Online Plant Nursery | Buy Plants Online',
        template: '%s | Vanam Store',
    },
    description: 'Vanam Store - Your trusted online plant nursery. Buy indoor plants, outdoor plants, pots, planters, combo offers and gift hampers. Rooted in Nature.',
    keywords: ['plants', 'indoor plants', 'outdoor plants', 'nursery', 'pots', 'planters', 'gift hampers', 'vanam store'],
    authors: [{ name: 'Vanam Store' }],
    creator: 'Vanam Store',
    publisher: 'Vanam Store',
    metadataBase: new URL('https://vanamstore.in'),
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        url: 'https://vanamstore.in',
        siteName: 'Vanam Store',
        title: 'Vanam Store - Online Plant Nursery',
        description: 'Buy plants, pots, and gift hampers online. Rooted in Nature.',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Vanam Store - Online Plant Nursery',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Vanam Store - Online Plant Nursery',
        description: 'Buy plants, pots, and gift hampers online. Rooted in Nature.',
        images: ['/og-image.jpg'],
    },
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: [
            { url: '/logo.png', type: 'image/png' },
        ],
        apple: '/apple-touch-icon.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
                <WhatsAppButton />
            </body>
        </html>
    );
}
