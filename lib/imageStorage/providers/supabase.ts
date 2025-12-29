/**
 * Supabase Storage Provider
 * Priority 3: Small files (logos, icons)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    StorageProviderInterface,
    ImageUploadResult,
    ImageVariants,
    SupabaseStorageConfig,
} from '../types';

export class SupabaseStorageProvider implements StorageProviderInterface {
    name: 'supabase' = 'supabase';
    private config: SupabaseStorageConfig;
    private client: SupabaseClient;

    constructor(config?: SupabaseStorageConfig) {
        this.config = config || {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            bucket: process.env.SUPABASE_STORAGE_BUCKET || 'images',
        };

        this.client = createClient(this.config.url, this.config.anonKey);
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
        const folder = options?.folder || 'uploads';
        const timestamp = Date.now();
        const uniqueFileName = `${folder}/${timestamp}-${fileName}`;

        // Convert Buffer to Blob if needed
        const blob = file instanceof Blob ? file : new Blob([file]);

        try {
            const { data, error } = await this.client.storage
                .from(this.config.bucket)
                .upload(uniqueFileName, blob, {
                    cacheControl: '2592000', // 30 days
                    upsert: false,
                });

            if (error) {
                throw new Error(`Supabase upload failed: ${error.message}`);
            }

            // Get public URL
            const { data: urlData } = this.client.storage
                .from(this.config.bucket)
                .getPublicUrl(data.path);

            const publicUrl = urlData.publicUrl;

            // Supabase doesn't auto-generate variants
            // Use Supabase Image Transformation (if enabled) or return same URL
            const variants: ImageVariants = {
                original: publicUrl,
                thumbnail: this.getOptimizedUrl(publicUrl, { width: 150, height: 150 }),
                small: this.getOptimizedUrl(publicUrl, { width: 300, height: 300 }),
                medium: this.getOptimizedUrl(publicUrl, { width: 600, height: 600 }),
                large: this.getOptimizedUrl(publicUrl, { width: 1200, height: 1200 }),
            };

            return {
                url: publicUrl,
                providerId: data.path,
                variants,
            };
        } catch (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }
    }

    async delete(providerId: string): Promise<boolean> {
        try {
            const { error } = await this.client.storage
                .from(this.config.bucket)
                .remove([providerId]);

            return !error;
        } catch (error) {
            console.error('Supabase delete error:', error);
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
        // Supabase Image Transformation (requires Pro plan or self-hosted with imgproxy)
        // Format: /storage/v1/render/image/public/{bucket}/{path}?width=X&height=Y
        if (!url || !options?.width) return url;

        try {
            const urlObj = new URL(url);

            // Check if already a transform URL
            if (urlObj.pathname.includes('/render/image/')) {
                urlObj.searchParams.set('width', options.width.toString());
                if (options.height) urlObj.searchParams.set('height', options.height.toString());
                if (options.quality) urlObj.searchParams.set('quality', options.quality.toString());
                return urlObj.toString();
            }

            // Convert public URL to transform URL
            const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/(.+)/);
            if (pathMatch) {
                const newPath = `/storage/v1/render/image/public/${pathMatch[1]}`;
                urlObj.pathname = newPath;
                urlObj.searchParams.set('width', options.width.toString());
                if (options.height) urlObj.searchParams.set('height', options.height.toString());
                if (options.quality) urlObj.searchParams.set('quality', options.quality.toString());
                return urlObj.toString();
            }
        } catch {
            // Return original if URL parsing fails
        }

        return url;
    }

    async isAvailable(): Promise<boolean> {
        if (!this.config.url || !this.config.anonKey) return false;

        try {
            const { error } = await this.client.storage.from(this.config.bucket).list('', { limit: 1 });
            return !error;
        } catch {
            return false;
        }
    }
}

// Singleton instance
let supabaseInstance: SupabaseStorageProvider | null = null;

export function getSupabaseStorageProvider(config?: SupabaseStorageConfig): SupabaseStorageProvider {
    if (!supabaseInstance || config) {
        supabaseInstance = new SupabaseStorageProvider(config);
    }
    return supabaseInstance;
}
