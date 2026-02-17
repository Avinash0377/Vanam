const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating banners with background images...');

    await prisma.banner.deleteMany({});

    const banners = [
        {
            title: 'Transform Your Space with',
            highlightText: 'Living Art',
            subtitle: 'Curated indoor & outdoor plants delivered to your doorstep with care.',
            accentBadge: '🌿 PLANT LOVERS',
            primaryBtnText: 'Explore Plants',
            primaryBtnLink: '/plants',
            secondaryBtnText: 'View Gift Combos',
            secondaryBtnLink: '/combos',
            bgGradient: 'linear-gradient(165deg, #0d3320 0%, #1a5035 50%, #22804a 100%)',
            imageUrl: '/banners/banner-plants.jpg',
            textColor: '#ffffff',
            displayOrder: 0,
            isActive: true,
        },
        {
            title: 'Flat 20% Off on All',
            highlightText: 'Combos',
            subtitle: 'Premium plant combos at unbeatable prices. Perfect gifts for every occasion.',
            accentBadge: '🔥 LIMITED OFFER',
            primaryBtnText: 'Shop Combos',
            primaryBtnLink: '/combos',
            secondaryBtnText: 'View All Plants',
            secondaryBtnLink: '/plants',
            bgGradient: 'linear-gradient(165deg, #78350f 0%, #92400e 50%, #b45309 100%)',
            imageUrl: '/banners/banner-combos.jpg',
            textColor: '#ffffff',
            displayOrder: 1,
            isActive: true,
        },
        {
            title: 'New Arrivals — Explore Our',
            highlightText: 'Fresh Collection',
            subtitle: 'Discover our latest hand-curated plant picks. Rare varieties now available.',
            accentBadge: '✨ JUST ARRIVED',
            primaryBtnText: 'View New Arrivals',
            primaryBtnLink: '/plants',
            bgGradient: 'linear-gradient(165deg, #312e81 0%, #4338ca 50%, #6366f1 100%)',
            imageUrl: '/banners/banner-arrivals.jpg',
            textColor: '#ffffff',
            displayOrder: 2,
            isActive: true,
        },
    ];

    for (const b of banners) {
        await prisma.banner.create({ data: b });
        console.log(`  ✓ Created: "${b.title} ${b.highlightText}" with image`);
    }

    console.log('\nDone! 3 banners with background images created.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
