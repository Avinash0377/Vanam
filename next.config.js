/** @type {import('next').NextConfig} */
const nextConfig = {
    // Image optimization
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**',
            },
        ],
        // Modern image formats for better compression
        formats: ['image/avif', 'image/webp'],
        // Device sizes for responsive images
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        // Image sizes for layout optimization
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        // Minimize layout shift
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    },

    // Performance optimizations
    compiler: {
        // Remove console.log in production (keep error/warn for debugging)
        removeConsole: process.env.NODE_ENV === 'production'
            ? { exclude: ['error', 'warn'] }
            : false,
    },

    // Enable experimental features for better performance
    experimental: {
        // Optimize package imports
        optimizePackageImports: ['@/components', 'lucide-react'],
    },

    // Headers for caching and security
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                ],
            },
            {
                // Cache static assets
                source: '/(.*)\\.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },

    // Reduce bundle size
    poweredByHeader: false,
};

module.exports = nextConfig;
