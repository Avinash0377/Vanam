const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');
const path = require('path');

// Configure Cloudinary from env
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

async function uploadToCloudinary(filePath, publicId) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            filePath,
            {
                folder: 'vanam-store/banners',
                public_id: publicId,
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 600, crop: 'fill', gravity: 'center' },
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' },
                ],
                overwrite: true,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
    });
}

async function main() {
    console.log('\n📸 Uploading banner images to Cloudinary...\n');

    const bannerDir = path.join(__dirname, '..', 'public', 'banners');

    const images = [
        { file: path.join(bannerDir, 'banner-plants.jpg'), publicId: 'banner-plants' },
        { file: path.join(bannerDir, 'banner-combos.jpg'), publicId: 'banner-combos' },
        { file: path.join(bannerDir, 'banner-arrivals.jpg'), publicId: 'banner-arrivals' },
    ];

    // Upload all 3 images
    const urls = [];
    for (const img of images) {
        try {
            console.log(`  ⬆️  Uploading ${img.publicId}...`);
            const result = await uploadToCloudinary(img.file, img.publicId);
            console.log(`  ✅ ${img.publicId} → ${result.secure_url}`);
            urls.push(result.secure_url);
        } catch (err) {
            console.error(`  ❌ Failed to upload ${img.publicId}:`, err.message);
            urls.push(null);
        }
    }

    // Update banners in database with Cloudinary URLs
    console.log('\n🔄 Updating banner records in database...\n');
    const banners = await prisma.banner.findMany({ orderBy: { displayOrder: 'asc' } });

    for (let i = 0; i < banners.length && i < urls.length; i++) {
        if (urls[i]) {
            await prisma.banner.update({
                where: { id: banners[i].id },
                data: { imageUrl: urls[i] },
            });
            console.log(`  ✅ Updated: "${banners[i].title}" → Cloudinary CDN`);
        }
    }

    console.log('\n🎉 Done! All banner images are now served via Cloudinary CDN.\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
