/**
 * Cloudinary Storage Provider
 * Priority 1: High-traffic product images
 */

import {
    StorageProviderInterface,
    ImageUploadResult,
    ImageVariants,
    CloudinaryConfig,
} from '../types';

export class CloudinaryProvider implements StorageProviderInterface {
    name: 'cloudinary' = 'cloudinary';
    private config: CloudinaryConfig;

    constructor(config?: CloudinaryConfig) {
        this.config = config || {
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',
            apiKey: process.env.CLOUDINARY_API_KEY || '',
            apiSecret: process.env.CLOUDINARY_API_SECRET || '',
            uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'restaurant_uploads',
            folder: 'restaurant-os',
        };
    }

    async upload(
        file: Buffer | Blob,
        fileName: string,
        options?: {
            folder?: string;
            optimize?: boolean;
            generateVariants?: boolean;
        }
    ): Promise<ImageUploadResult> {
        const formData = new FormData();

        // Convert Buffer to Blob if needed
        const blob = file instanceof Blob ? file : new Blob([file]);
        formData.append('file', blob, fileName);
        formData.append('upload_preset', this.config.uploadPreset || 'restaurant_uploads');
        formData.append('folder', options?.folder || this.config.folder || 'restaurant-os');

        // Eager transformations for variants
        if (options?.generateVariants !== false) {
            formData.append('eager', 'c_thumb,w_150,h_150|c_fill,w_300,h_300|c_fill,w_600,h_600|c_fill,w_1200,h_1200');
            formData.append('eager_async', 'true');
        }

        // Auto optimization
        if (options?.optimize !== false) {
            formData.append('quality', 'auto');
            formData.append('fetch_format', 'auto');
        }

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Cloudinary upload failed: ${error}`);
            }

            const data = await response.json();

            // Build variants from eager transformations or construct URLs
            const variants: ImageVariants = {
                thumbnail: this.getOptimizedUrl(data.secure_url, { width: 150, height: 150 }),
                small: this.getOptimizedUrl(data.secure_url, { width: 300, height: 300 }),
                medium: this.getOptimizedUrl(data.secure_url, { width: 600, height: 600 }),
                large: this.getOptimizedUrl(data.secure_url, { width: 1200, height: 1200 }),
                original: data.secure_url,
            };

            return {
                url: data.secure_url,
                providerId: data.public_id,
                variants,
                width: data.width,
                height: data.height,
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    }

    async delete(providerId: string): Promise<boolean> {
        try {
            const timestamp = Math.round(new Date().getTime() / 1000);
            const signature = await this.generateSignature(providerId, timestamp);

            const formData = new FormData();
            formData.append('public_id', providerId);
            formData.append('api_key', this.config.apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/destroy`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await response.json();
            return data.result === 'ok';
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            return false;
        }
    }

    getOptimizedUrl(
        url: string,
        options?: {
            width?: number;
            height?: number;
            quality?: number;
            format?: 'webp' | 'avif' | 'jpg' | 'png';
        }
    ): string {
        if (!url || !url.includes('cloudinary.com')) return url;

        const transformations: string[] = [];

        if (options?.width && options?.height) {
            transformations.push(`c_fill,w_${options.width},h_${options.height}`);
        } else if (options?.width) {
            transformations.push(`c_scale,w_${options.width}`);
        } else if (options?.height) {
            transformations.push(`c_scale,h_${options.height}`);
        }

        transformations.push(`q_${options?.quality || 'auto'}`);
        transformations.push(`f_${options?.format || 'auto'}`);

        // Insert transformations into URL
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return url;

        return (
            url.slice(0, uploadIndex + 8) +
            transformations.join(',') +
            '/' +
            url.slice(uploadIndex + 8)
        );
    }

    async isAvailable(): Promise<boolean> {
        if (!this.config.cloudName) return false;

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.config.cloudName}/resources/image`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Basic ${Buffer.from(
                            `${this.config.apiKey}:${this.config.apiSecret}`
                        ).toString('base64')}`,
                    },
                }
            );
            return response.ok;
        } catch {
            return false;
        }
    }

    private async generateSignature(publicId: string, timestamp: number): Promise<string> {
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${this.config.apiSecret}`;

        // Use Web Crypto API for browser/edge compatibility
        const encoder = new TextEncoder();
        const data = encoder.encode(stringToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

// Singleton instance
let cloudinaryInstance: CloudinaryProvider | null = null;

export function getCloudinaryProvider(config?: CloudinaryConfig): CloudinaryProvider {
    if (!cloudinaryInstance || config) {
        cloudinaryInstance = new CloudinaryProvider(config);
    }
    return cloudinaryInstance;
}
