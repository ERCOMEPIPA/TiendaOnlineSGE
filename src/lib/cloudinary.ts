import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
    api_key: import.meta.env.CLOUDINARY_API_KEY,
    api_secret: import.meta.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Generate optimized image URL with transformations
 * @param publicId - Cloudinary public ID of the image
 * @param options - Transformation options
 */
export function getOptimizedImageUrl(
    publicId: string,
    options?: {
        width?: number;
        height?: number;
        crop?: 'fill' | 'fit' | 'scale' | 'thumb';
        quality?: 'auto' | number;
        format?: 'auto' | 'webp' | 'jpg' | 'png';
    }
): string {
    const defaultOptions = {
        quality: 'auto' as const,
        format: 'auto' as const,
        fetch_format: 'auto',
        ...options,
    };

    return cloudinary.url(publicId, defaultOptions);
}

/**
 * Helper functions for common image sizes
 */
export const imageHelpers = {
    thumbnail: (publicId: string) =>
        getOptimizedImageUrl(publicId, { width: 150, height: 150, crop: 'fill' }),

    medium: (publicId: string) =>
        getOptimizedImageUrl(publicId, { width: 500, height: 500, crop: 'fit' }),

    large: (publicId: string) =>
        getOptimizedImageUrl(publicId, { width: 1200, crop: 'fit' }),

    hero: (publicId: string) =>
        getOptimizedImageUrl(publicId, { width: 1920, height: 1080, crop: 'fill' }),
};
