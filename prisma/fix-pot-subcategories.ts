// Fix pot subcategories: remove matchField since 'material' is not a DB field
// Products should use tags like "Ceramic", "Terracotta" etc. for matching
// Run with: npx tsx prisma/fix-pot-subcategories.ts

import prisma from '../src/lib/prisma';

async function main() {
    console.log('🔧 Fixing pot subcategories...');

    // Remove matchField from pot subcategories that use material:xxx
    // and ensure they rely on matchTags instead
    const updates = [
        { slug: 'ceramic-pots',  matchTags: ['Ceramic'],      matchField: null },
        { slug: 'plastic-pots',  matchTags: ['Durable', 'Plastic'], matchField: null },
        { slug: 'terracotta',    matchTags: ['Terracotta'],    matchField: null },
        { slug: 'metal-planters', matchTags: ['Metal'],        matchField: null },
    ];

    for (const u of updates) {
        try {
            await prisma.subcategory.update({
                where: { slug: u.slug },
                data: { matchTags: u.matchTags, matchField: u.matchField },
            });
            console.log(`  ✅ Fixed "${u.slug}" → tags: [${u.matchTags.join(', ')}]`);
        } catch (error) {
            console.log(`  ⏭ "${u.slug}" not found, skipping`);
        }
    }

    console.log('✅ Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
