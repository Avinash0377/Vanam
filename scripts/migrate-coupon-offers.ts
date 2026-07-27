/**
 * Migration Script: Backfill existing coupons with PDP offer fields.
 *
 * This script sets safe defaults on all existing coupons so nothing breaks:
 * - showOnProductPage: false (existing coupons stay hidden on PDP)
 * - applicabilityScope: derived from existing applicableTo field
 * - offerType: derived from existing discountType field
 * - includedProductIds / includedCategoryIds: copied from applicableIds based on scope
 * - perUserLimit: copied from usagePerUser
 *
 * Run with: npx tsx scripts/migrate-coupon-offers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting coupon offers migration...\n');

    const coupons = await prisma.coupon.findMany();
    console.log(`Found ${coupons.length} existing coupons to migrate.\n`);

    let migrated = 0;
    let skipped = 0;

    for (const coupon of coupons) {
        // Skip if already migrated (has applicabilityScope set to non-default AND has showOnProductPage explicitly set)
        // We can detect this by checking if the new fields already have non-default values
        // Since MongoDB doesn't have migrations, fields will be undefined/null until explicitly set
        const needsMigration = (coupon as Record<string, unknown>).applicabilityScope === undefined
            || (coupon as Record<string, unknown>).offerType === undefined;

        if (!needsMigration && (coupon as Record<string, unknown>).applicabilityScope !== undefined) {
            skipped++;
            continue;
        }

        // Map existing discountType to new offerType
        const offerType = coupon.discountType === 'FIXED' ? 'FLAT' : 'PERCENTAGE';

        // Map existing applicableTo to new applicabilityScope
        let applicabilityScope: 'ALL_PRODUCTS' | 'CATEGORY' | 'PRODUCT' | 'COLLECTION_TAG' = 'ALL_PRODUCTS';
        const includedProductIds: string[] = [];
        const includedCategoryIds: string[] = [];

        switch (coupon.applicableTo) {
            case 'PRODUCT':
                applicabilityScope = 'PRODUCT';
                includedProductIds.push(...coupon.applicableIds);
                break;
            case 'CATEGORY':
                applicabilityScope = 'CATEGORY';
                includedCategoryIds.push(...coupon.applicableIds);
                break;
            case 'ALL':
            default:
                applicabilityScope = 'ALL_PRODUCTS';
                break;
        }

        try {
            await prisma.coupon.update({
                where: { id: coupon.id },
                data: {
                    offerType,
                    showOnProductPage: false, // Existing coupons stay hidden on PDP
                    autoApply: false,
                    displayTitle: null,
                    displaySubtext: null,
                    sortOrder: 0,
                    applicabilityScope,
                    includedProductIds,
                    excludedProductIds: [],
                    includedCategoryIds,
                    includedTags: [],
                    stackable: false,
                    perUserLimit: coupon.usagePerUser > 0 ? coupon.usagePerUser : null,
                },
            });

            migrated++;
            console.log(`  ✅ ${coupon.code} → offerType=${offerType}, scope=${applicabilityScope}`);
        } catch (error) {
            console.error(`  ❌ Failed to migrate ${coupon.code}:`, error);
        }
    }

    console.log(`\n✅ Migration complete: ${migrated} migrated, ${skipped} already up-to-date.`);
}

main()
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
