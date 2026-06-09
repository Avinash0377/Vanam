// Seed script for initial subcategories
// Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-subcategories.ts

import prisma from '../src/lib/prisma';

const subcategories = [
    // ── Plant Subcategories ──
    { name: 'Indoor Plants',      slug: 'indoor-plants',      productType: 'PLANT', matchTags: [],                                  matchField: 'suitableFor:INDOOR',  displayOrder: 1, image: '/peace-lily.png' },
    { name: 'Outdoor Plants',     slug: 'outdoor-plants',     productType: 'PLANT', matchTags: [],                                  matchField: 'suitableFor:OUTDOOR', displayOrder: 2, image: '/rubber-plant.png' },
    { name: 'Air Purifying',      slug: 'air-purifying',      productType: 'PLANT', matchTags: ['Air Purifying'],                   matchField: null,                  displayOrder: 3, image: '/snake-plant.png' },
    { name: 'Low Maintenance',    slug: 'low-maintenance',    productType: 'PLANT', matchTags: ['Low Maintenance', 'Easy Care'],    matchField: null,                  displayOrder: 4, image: '/pothos.png' },
    { name: 'Beginner Friendly',  slug: 'beginner-friendly',  productType: 'PLANT', matchTags: ['Beginner Friendly'],               matchField: null,                  displayOrder: 5, image: '/peace-lily.png' },
    { name: 'Succulents & Cacti', slug: 'succulents-cacti',   productType: 'PLANT', matchTags: ['Drought Tolerant'],                matchField: null,                  displayOrder: 6, image: '/succulent.png' },
    { name: 'Pet Friendly',       slug: 'pet-friendly',       productType: 'PLANT', matchTags: ['Pet Friendly'],                    matchField: null,                  displayOrder: 7, image: '/pothos.png' },
    { name: 'Gift Ready',         slug: 'gift-ready',         productType: 'PLANT', matchTags: ['Gift Ready', 'Perfect Gift'],      matchField: null,                  displayOrder: 8, image: '/hero-plant.png' },

    // ── Pot Subcategories ──
    { name: 'Ceramic Pots',       slug: 'ceramic-pots',       productType: 'POT',   matchTags: ['Ceramic'],                         matchField: null,                  displayOrder: 1, image: null },
    { name: 'Hanging Pots',       slug: 'hanging-pots',       productType: 'POT',   matchTags: ['Hanging'],                         matchField: null,                  displayOrder: 2, image: null },
    { name: 'Plastic Pots',       slug: 'plastic-pots',       productType: 'POT',   matchTags: ['Durable', 'Plastic'],              matchField: null,                  displayOrder: 3, image: null },
    { name: 'Terracotta',         slug: 'terracotta',         productType: 'POT',   matchTags: ['Terracotta'],                      matchField: null,                  displayOrder: 4, image: null },
    { name: 'Self Watering',      slug: 'self-watering',      productType: 'POT',   matchTags: ['Self Watering'],                   matchField: null,                  displayOrder: 5, image: null },
    { name: 'Decorative',         slug: 'decorative',         productType: 'POT',   matchTags: ['Handcrafted', 'Premium', 'Decorative'], matchField: null,              displayOrder: 6, image: null },
    { name: 'Metal Planters',     slug: 'metal-planters',     productType: 'POT',   matchTags: ['Metal'],                           matchField: null,                  displayOrder: 7, image: null },
];

async function main() {
    console.log('🌱 Seeding subcategories...');

    for (const sc of subcategories) {
        const existing = await prisma.subcategory.findUnique({ where: { slug: sc.slug } });
        if (existing) {
            console.log(`  ⏭ "${sc.name}" already exists, skipping`);
            continue;
        }
        await prisma.subcategory.create({
            data: {
                name: sc.name,
                slug: sc.slug,
                productType: sc.productType,
                matchTags: sc.matchTags,
                matchField: sc.matchField,
                displayOrder: sc.displayOrder,
                image: sc.image,
                isActive: true,
            },
        });
        console.log(`  ✅ Created "${sc.name}"`);
    }

    console.log('✅ Done seeding subcategories!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
