import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// POST upload image
async function handleUpload(request: NextRequest, user: JWTPayload) {
    try {
        // Rate limit: 20 uploads per hour per admin
        const rateLimitKey = `upload:${user.userId}`;
        const rateCheck = checkRateLimit(rateLimitKey, { maxRequests: 20, windowSeconds: 60 * 60 });
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Upload rate limit exceeded. Please try again later.' },
                { status: 429 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = formData.get('folder') as string || 'vanam-store/products';

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (10MB max)
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const result = await uploadImage(buffer, folder);

        return NextResponse.json({
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAdmin(request, handleUpload);
}

// DELETE image
async function handleDelete(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { publicId } = body;

        if (!publicId) {
            return NextResponse.json(
                { error: 'Public ID is required' },
                { status: 400 }
            );
        }

        const success = await deleteImage(publicId);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to delete image' },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: 'Image deleted successfully' });

    } catch (error) {
        console.error('Delete image error:', error);
        return NextResponse.json(
            { error: 'Failed to delete image' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    return withAdmin(request, handleDelete);
}
