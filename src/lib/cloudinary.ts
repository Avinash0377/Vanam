import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
}

/**
 * Upload an image to Cloudinary
 */
export async function uploadImage(
    file: Buffer | string,
    folder: string = 'vanam-store'
): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder,
            resource_type: 'image' as const,
            transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' },
            ],
        };

        if (typeof file === 'string' && file.startsWith('data:')) {
            // Base64 upload
            cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
                if (error) {
                    reject(error);
                } else if (result) {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        width: result.width,
                        height: result.height,
                    });
                }
            });
        } else if (Buffer.isBuffer(file)) {
            // Buffer upload
            cloudinary.uploader
                .upload_stream(uploadOptions, (error, result) => {
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                            width: result.width,
                            height: result.height,
                        });
                    }
                })
                .end(file);
        } else {
            reject(new Error('Invalid file format'));
        }
    });
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<boolean> {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error('Error deleting image:', error);
        return false;
    }
}

/**
 * Generate an optimized URL for an image
 */
export function getOptimizedUrl(
    publicId: string,
    options: { width?: number; height?: number } = {}
): string {
    return cloudinary.url(publicId, {
        width: options.width || 800,
        height: options.height,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
    });
}

export default cloudinary;
