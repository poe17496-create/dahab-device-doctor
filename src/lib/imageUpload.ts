import { v2 as cloudinary } from 'cloudinary';

/**
 * @fileoverview Image Upload Service with Cloudinary CDN
 * 
 * This module handles image upload and optimization using Cloudinary:
 * - Image upload with transformation
 * - Automatic optimization
 * - CDN delivery
 * - Format conversion
 * 
 * @module imageUpload
 */

// Configure Cloudinary (if credentials are available)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload image to Cloudinary CDN
 * 
 * @param file - File object or base64 string
 * @param options - Upload options (folder, transformation, etc.)
 * @returns Promise with upload result including URL
 * 
 * @example
 * ```ts
 * const result = await uploadImage(file, {
 *   folder: 'diagnostic-images',
 *   transformation: [{ width: 800, quality: 'auto' }]
 * });
 * console.log(result.secure_url);
 * ```
 */
export async function uploadImage(
  file: File | string,
  options: {
    folder?: string;
    transformation?: any[];
    publicId?: string;
  } = {}
): Promise<{ secure_url: string; public_id: string }> {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary not configured');
    }

    let uploadResult: any;

    if (typeof file === 'string') {
      // Handle base64 string
      uploadResult = await cloudinary.uploader.upload(file, {
        folder: options.folder || 'dahab-device-doctor',
        transformation: options.transformation || [
          { width: 800, quality: 'auto', fetch_format: 'auto' },
        ],
        public_id: options.publicId,
      });
    } else {
      // Handle File object - convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      uploadResult = await cloudinary.uploader.upload(dataUrl, {
        folder: options.folder || 'dahab-device-doctor',
        transformation: options.transformation || [
          { width: 800, quality: 'auto', fetch_format: 'auto' },
        ],
        public_id: options.publicId,
      });
    }

    return {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Get optimized image URL from Cloudinary
 * 
 * @param publicId - Cloudinary public ID
 * @param options - Transformation options
 * @returns Optimized image URL
 * 
 * @example
 * ```ts
 * const url = getOptimizedImageUrl('abc123', {
 *   width: 400,
 *   quality: 80,
 *   format: 'webp'
 * });
 * ```
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png' | 'auto';
  } = {}
): string {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return publicId; // Return original if Cloudinary not configured
  }

  const transformations: any[] = [];
  
  if (options.width) transformations.push({ width: options.width });
  if (options.height) transformations.push({ height: options.height });
  if (options.quality) transformations.push({ quality: options.quality });
  if (options.format) transformations.push({ fetch_format: options.format });

  return cloudinary.url(publicId, {
    transformation: transformations.length > 0 ? transformations : undefined,
    secure: true,
  });
}

/**
 * Delete image from Cloudinary
 * 
 * @param publicId - Cloudinary public ID
 * @returns Promise with deletion result
 * 
 * @example
 * ```ts
 * await deleteImage('abc123');
 * ```
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary not configured');
    }

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}

/**
 * Check if Cloudinary is configured
 * 
 * @returns Boolean indicating if Cloudinary is ready
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
