/**
 * One-time migration script to fix mismatched URL slugs.
 * 
 * Regenerates slugs from the `name` field for all Products, Combos, and GiftHampers.
 * Handles collisions by appending a numeric suffix (-2, -3, etc.).
 * 
 * Usage:
 *   npx tsx scripts/fix-slugs.ts
 * 
 * Add --dry-run to preview changes without writing to the database:
 *   npx tsx scripts/fix-slugs.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function fixSlugs() {
    console.log(`\n🔧 Slug Migration ${isDryRun ? '(DRY RUN)' : ''}\n`);

    // ── Products ──
    const products = await prisma.product.findMany({
        select: { id: true, name: true, slug: true },
    });

    const productSlugMap = new Map<string, number>();
    let productFixed = 0;

    for (const product of products) {
        const baseSlug = generateSlug(product.name);
        const count = productSlugMap.get(baseSlug) || 0;
        const newSlug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
        productSlugMap.set(baseSlug, count + 1);

        if (newSlug !== product.slug) {
            console.log(`  Product: "${product.name}"`);
            console.log(`    Old: ${product.slug}`);
            console.log(`    New: ${newSlug}`);
            if (!isDryRun) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { slug: newSlug },
                });
            }
            productFixed++;
        }
    }

    // ── Combos ──
    const combos = await prisma.combo.findMany({
        select: { id: true, name: true, slug: true },
    });

    const comboSlugMap = new Map<string, number>();
    let comboFixed = 0;

    for (const combo of combos) {
        const baseSlug = generateSlug(combo.name);
        const count = comboSlugMap.get(baseSlug) || 0;
        const newSlug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
        comboSlugMap.set(baseSlug, count + 1);

        if (newSlug !== combo.slug) {
            console.log(`  Combo: "${combo.name}"`);
            console.log(`    Old: ${combo.slug}`);
            console.log(`    New: ${newSlug}`);
            if (!isDryRun) {
                await prisma.combo.update({
                    where: { id: combo.id },
                    data: { slug: newSlug },
                });
            }
            comboFixed++;
        }
    }

    // ── Gift Hampers ──
    const hampers = await prisma.giftHamper.findMany({
        select: { id: true, name: true, slug: true },
    });

    const hamperSlugMap = new Map<string, number>();
    let hamperFixed = 0;

    for (const hamper of hampers) {
        const baseSlug = generateSlug(hamper.name);
        const count = hamperSlugMap.get(baseSlug) || 0;
        const newSlug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
        hamperSlugMap.set(baseSlug, count + 1);

        if (newSlug !== hamper.slug) {
            console.log(`  Hamper: "${hamper.name}"`);
            console.log(`    Old: ${hamper.slug}`);
            console.log(`    New: ${newSlug}`);
            if (!isDryRun) {
                await prisma.giftHamper.update({
                    where: { id: hamper.id },
                    data: { slug: newSlug },
                });
            }
            hamperFixed++;
        }
    }

    console.log(`\n✅ Summary:`);
    console.log(`  Products fixed: ${productFixed}/${products.length}`);
    console.log(`  Combos fixed:   ${comboFixed}/${combos.length}`);
    console.log(`  Hampers fixed:  ${hamperFixed}/${hampers.length}`);

    if (isDryRun) {
        console.log(`\n⚠️  This was a dry run. No changes were made.`);
        console.log(`   Run without --dry-run to apply changes.\n`);
    } else {
        console.log(`\n🎉 All slugs updated successfully!\n`);
    }
}

fixSlugs()
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
