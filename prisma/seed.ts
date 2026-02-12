import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);

    // First try to find existing admin
    let admin = await prisma.user.findFirst({
        where: { email: 'vanamstore@gmail.com' }
    });

    if (!admin) {
        admin = await prisma.user.create({
            data: {
                name: 'Vanam Admin',
                mobile: '8897249374',
                email: 'vanamstore@gmail.com',
                password: adminPassword,
                role: 'ADMIN',
            },
        });
        console.log('✅ Admin user created:', admin.email);
    } else {
        console.log('✅ Admin user already exists:', admin.email);
    }

    // Create Categories
    const categoriesData = [
        { name: 'Indoor Plants', slug: 'indoor-plants', description: 'Beautiful plants that thrive indoors' },
        { name: 'Outdoor Plants', slug: 'outdoor-plants', description: 'Hardy plants for your garden' },
        { name: 'Succulents', slug: 'succulents', description: 'Low maintenance desert plants' },
        { name: 'Flowering Plants', slug: 'flowering-plants', description: 'Add color to your space' },
        { name: 'Air Purifying', slug: 'air-purifying', description: 'Clean your indoor air naturally' },
        { name: 'Ceramic Pots', slug: 'ceramic-pots', description: 'Handcrafted ceramic planters' },
        { name: 'Plastic Pots', slug: 'plastic-pots', description: 'Durable and affordable planters' },
    ];

    const categories: Record<string, string> = {};
    for (const cat of categoriesData) {
        let category = await prisma.category.findFirst({
            where: { slug: cat.slug }
        });

        if (!category) {
            category = await prisma.category.create({
                data: cat,
            });
        }
        categories[cat.slug] = category.id;
    }
    console.log('✅ Categories created');

    // Create Plants
    const plants = [
        {
            name: 'Money Plant Golden',
            slug: 'money-plant-golden',
            description: 'The Money Plant is believed to bring good luck and prosperity. Easy to care for and perfect for beginners.',
            careInstructions: 'Water once a week. Keep in indirect sunlight. Trim regularly for bushy growth.',
            productType: 'PLANT' as const,
            size: 'MEDIUM' as const,
            suitableFor: 'INDOOR' as const,
            price: 299,
            comparePrice: 399,
            stock: 25,
            categoryId: categories['indoor-plants'],
            featured: true,
        },
        {
            name: 'Snake Plant (Sansevieria)',
            slug: 'snake-plant',
            description: 'NASA-approved air purifier that removes toxins. Extremely low maintenance and drought tolerant.',
            careInstructions: 'Water every 2-3 weeks. Tolerates low light. Avoid overwatering.',
            productType: 'PLANT' as const,
            size: 'MEDIUM' as const,
            suitableFor: 'INDOOR' as const,
            price: 449,
            comparePrice: 599,
            stock: 20,
            categoryId: categories['air-purifying'],
            featured: true,
        },
        {
            name: 'Peace Lily',
            slug: 'peace-lily',
            description: 'Elegant white flowers and dark green leaves. Excellent air purifier and low light tolerant.',
            careInstructions: 'Keep soil moist. Low to medium light. Mist leaves weekly.',
            productType: 'PLANT' as const,
            size: 'MEDIUM' as const,
            suitableFor: 'INDOOR' as const,
            price: 549,
            comparePrice: 699,
            stock: 15,
            categoryId: categories['air-purifying'],
            featured: true,
        },
        {
            name: 'Areca Palm',
            slug: 'areca-palm',
            description: 'Tropical elegance with feathery fronds. Natural humidifier and air purifier.',
            careInstructions: 'Bright indirect light. Water when top soil is dry. Mist regularly.',
            productType: 'PLANT' as const,
            size: 'BIG' as const,
            suitableFor: 'BOTH' as const,
            price: 799,
            comparePrice: 999,
            stock: 10,
            categoryId: categories['indoor-plants'],
            featured: true,
        },
        {
            name: 'Jade Plant',
            slug: 'jade-plant',
            description: 'Symbol of good luck and prosperity. Thick, fleshy leaves store water.',
            careInstructions: 'Full sun to bright light. Water when soil is dry. Well-draining soil.',
            productType: 'PLANT' as const,
            size: 'SMALL' as const,
            suitableFor: 'BOTH' as const,
            price: 249,
            comparePrice: 349,
            stock: 30,
            categoryId: categories['succulents'],
            featured: false,
        },
        {
            name: 'Rubber Plant',
            slug: 'rubber-plant',
            description: 'Bold, glossy leaves make a statement. Easy care and fast growing.',
            careInstructions: 'Medium to bright light. Water weekly. Wipe leaves to keep glossy.',
            productType: 'PLANT' as const,
            size: 'BIG' as const,
            suitableFor: 'INDOOR' as const,
            price: 699,
            comparePrice: 899,
            stock: 12,
            categoryId: categories['indoor-plants'],
            featured: false,
        },
        {
            name: 'Spider Plant',
            slug: 'spider-plant',
            description: 'Produces baby plantlets. Safe for pets and great air purifier.',
            careInstructions: 'Indirect light. Water regularly. Propagate babies easily.',
            productType: 'PLANT' as const,
            size: 'MEDIUM' as const,
            suitableFor: 'INDOOR' as const,
            price: 299,
            comparePrice: 399,
            stock: 22,
            categoryId: categories['air-purifying'],
            featured: false,
        },
        {
            name: 'Aloe Vera',
            slug: 'aloe-vera',
            description: 'Medicinal plant with healing properties. Easy to grow succulent.',
            careInstructions: 'Bright light. Water sparingly. Use well-draining soil.',
            productType: 'PLANT' as const,
            size: 'SMALL' as const,
            suitableFor: 'BOTH' as const,
            price: 199,
            comparePrice: 299,
            stock: 35,
            categoryId: categories['succulents'],
            featured: false,
        },
    ];

    for (const plant of plants) {
        const existing = await prisma.product.findFirst({
            where: { slug: plant.slug }
        });

        if (!existing) {
            await prisma.product.create({
                data: plant,
            });
        }
    }
    console.log('✅ Plants created');

    // Create Pots
    const pots = [
        {
            name: 'Ceramic Round Pot - White',
            slug: 'ceramic-round-pot-white',
            description: 'Elegant white ceramic pot with drainage hole. Perfect for indoor plants.',
            productType: 'POT' as const,
            size: 'MEDIUM' as const,
            price: 349,
            comparePrice: 449,
            stock: 20,
            categoryId: categories['ceramic-pots'],
        },
        {
            name: 'Ceramic Round Pot - Terracotta',
            slug: 'ceramic-round-pot-terracotta',
            description: 'Natural terracotta finish. Classic look for any plant.',
            productType: 'POT' as const,
            size: 'MEDIUM' as const,
            price: 299,
            comparePrice: 399,
            stock: 25,
            categoryId: categories['ceramic-pots'],
        },
    ];

    for (const pot of pots) {
        const existing = await prisma.product.findFirst({
            where: { slug: pot.slug }
        });

        if (!existing) {
            await prisma.product.create({
                data: pot,
            });
        }
    }
    console.log('✅ Pots created');

    // Create Combos
    const combos = [
        {
            name: 'Air Purifier Trio',
            slug: 'air-purifier-trio',
            description: 'Three best air purifying plants: Snake Plant, Peace Lily, and Spider Plant.',
            includes: [
                { name: 'Snake Plant', quantity: 1 },
                { name: 'Peace Lily', quantity: 1 },
                { name: 'Spider Plant', quantity: 1 },
            ],
            suitableFor: 'INDOOR' as const,
            price: 999,
            comparePrice: 1297,
            stock: 8,
            featured: true,
        },
        {
            name: 'Beginner Plant Pack',
            slug: 'beginner-plant-pack',
            description: 'Perfect for new plant parents. Easy to care indoor plants.',
            includes: [
                { name: 'Money Plant', quantity: 1 },
                { name: 'Jade Plant', quantity: 1 },
                { name: 'Aloe Vera', quantity: 1 },
            ],
            suitableFor: 'INDOOR' as const,
            price: 599,
            comparePrice: 747,
            stock: 12,
            featured: true,
        },
    ];

    for (const combo of combos) {
        const existing = await prisma.combo.findFirst({
            where: { slug: combo.slug }
        });

        if (!existing) {
            await prisma.combo.create({
                data: combo,
            });
        }
    }
    console.log('✅ Combos created');

    // Create Gift Hampers
    const hampers = [
        {
            name: 'Plant Lover Gift Box',
            slug: 'plant-lover-gift-box',
            description: 'Beautifully wrapped gift box with a plant, ceramic pot, and care guide.',
            includes: [
                { name: 'Money Plant', quantity: 1 },
                { name: 'Ceramic Pot', quantity: 1 },
                { name: 'Care Guide', quantity: 1 },
                { name: 'Fertilizer Sample', quantity: 1 },
            ],
            giftWrap: true,
            messageCard: true,
            price: 799,
            comparePrice: 999,
            stock: 10,
            featured: true,
        },
        {
            name: 'Premium Succulent Gift Set',
            slug: 'premium-succulent-gift-set',
            description: 'Collection of 3 succulents in decorative pots with gift packaging.',
            includes: [
                { name: 'Jade Plant', quantity: 1 },
                { name: 'Aloe Vera', quantity: 1 },
                { name: 'Echeveria', quantity: 1 },
                { name: '3 Mini Pots', quantity: 1 },
            ],
            giftWrap: true,
            messageCard: true,
            price: 1199,
            comparePrice: 1499,
            stock: 6,
            featured: true,
        },
    ];

    for (const hamper of hampers) {
        const existing = await prisma.giftHamper.findFirst({
            where: { slug: hamper.slug }
        });

        if (!existing) {
            await prisma.giftHamper.create({
                data: hamper,
            });
        }
    }
    console.log('✅ Gift Hampers created');

    console.log('🎉 Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
