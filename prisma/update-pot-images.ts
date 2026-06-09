// Update pot subcategory images in the database
// Run with: npx tsx prisma/update-pot-images.ts

import prisma from '../src/lib/prisma';

const updates = [
    { slug: 'ceramic-pots',    image: '/ceramic-pot.png' },
    { slug: 'hanging-pots',    image: '/hanging-pot.png' },
    { slug: 'plastic-pots',    image: '/plastic-pot.png' },
    { slug: 'terracotta',      image: '/terracotta-pot.png' },
    { slug: 'self-watering',   image: '/self-watering-pot.png' },
    { slug: 'decorative',      image: '/decorative-pot.png' },
    { slug: 'metal-planters',  image: '/metal-planter.png' },
];

async function main() {
    console.log('🖼️  Updating pot subcategory images...');

    for (const u of updates) {
        try {
            await prisma.subcategory.update({
                where: { slug: u.slug },
                data: { image: u.image },
            });
            console.log(`  ✅ ${u.slug} → ${u.image}`);
        } catch {
            console.log(`  ⏭ "${u.slug}" not found, skipping`);
        }
    }

    console.log('✅ Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
