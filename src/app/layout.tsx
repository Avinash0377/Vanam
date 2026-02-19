import type { Metadata } from 'next';
import Script from 'next/script';
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

// Viewport export — separate from metadata per Next.js 14+ spec.
// Forces 1:1 pixel mapping on mobile: browser renders at exact device
// pixel size instead of scaling a virtual desktop canvas down.
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
    themeColor: '#1a4d2e',
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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

                {/* Google Analytics 4 — loads after interactive, does not block rendering */}
                {GA_ID && (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                            strategy="afterInteractive"
                        />
                        <Script
                            id="ga4-init"
                            strategy="afterInteractive"
                            dangerouslySetInnerHTML={{
                                __html: `
                                    window.dataLayer = window.dataLayer || [];
                                    function gtag(){dataLayer.push(arguments);}
                                    gtag('js', new Date());
                                    gtag('config', '${GA_ID}', { send_page_view: true });
                                `,
                            }}
                        />
                    </>
                )}

                {/* Meta Pixel — loads after interactive, does not block rendering */}
                {PIXEL_ID && (
                    <Script
                        id="meta-pixel"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                                !function(f,b,e,v,n,t,s){
                                    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                                    n.queue=[];t=b.createElement(e);t.async=!0;
                                    t.src=v;s=b.getElementsByTagName(e)[0];
                                    s.parentNode.insertBefore(t,s)
                                }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
                                fbq('init', '${PIXEL_ID}');
                                fbq('track', 'PageView');
                            `,
                        }}
                    />
                )}
            </body>
        </html>
    );
}
