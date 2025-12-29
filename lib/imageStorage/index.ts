/**
 * Main Image Storage Service
 * Unified API for uploading, retrieving, and managing images
 */

import {
    UploadRequest,
    UploadResponse,
    ImageMetadata,
    ImageType,
    StorageProvider,
    ImageVariants,
} from './types';
import { getImageRouter } from './router';
import { getImageCacheManager } from './cache';
import { getQuotaManager } from './quotaManager';

export class ImageStorageService {
    private router = getImageRouter();
    private cache = getImageCacheManager();
    private quotaManager = getQuotaManager();

    /**
     * Upload an image with automatic provider selection
     */
    async upload(request: UploadRequest): Promise<UploadResponse> {
        const startTime = Date.now();

        try {
            // Get file details
            const fileBuffer = await this.fileToBuffer(request.file);
            const fileSizeBytes = fileBuffer.byteLength;
            const fileName = request.file instanceof File ? request.file.name : 'upload.jpg';
            const mimeType = request.file instanceof File ? request.file.type : 'image/jpeg';

            // Get optimal provider
            const routingDecision = await this.router.getOptimalProvider(
                request.imageType,
                fileSizeBytes,
                request.restaurantId
            );

            // Try upload with fallbacks
            let lastError: Error | null = null;
            const providersToTry = [routingDecision.provider, ...routingDecision.fallbackProviders];

            for (const provider of providersToTry) {
                try {
                    const result = await this.uploadToProvider(
                        provider,
                        fileBuffer,
                        fileName,
                        {
                            folder: `${request.restaurantId}/${request.imageType}s`,
                            optimize: request.optimize !== false,
                            generateVariants: request.generateVariants !== false,
                        }
                    );

                    // Store metadata
                    const metadata = await this.cache.storeImage({
                        restaurantId: request.restaurantId,
                        storageProvider: provider,
                        imageType: request.imageType,
                        originalUrl: result.url,
                        cdnUrl: result.url,
                        thumbnailUrl: result.variants?.thumbnail,
                        providerId: result.providerId,
                        fileName,
                        fileSizeBytes,
                        mimeType,
                        width: result.width,
                        height: result.height,
                        variants: result.variants || {},
                        altText: request.altText,
                        caption: request.caption,
                        cacheControl: 'public, max-age=2592000',
                        status: 'completed',
                        accessCount: 0,
                    });

                    // Update quota
                    await this.router.incrementQuotaUsage(request.restaurantId, provider, fileSizeBytes);

                    return {
                        success: true,
                        image: metadata,
                        uploadDurationMs: Date.now() - startTime,
                        provider,
                        originalSize: fileSizeBytes,
                    };
                } catch (error) {
                    lastError = error as Error;
                    console.warn(`Upload to ${provider} failed, trying next provider...`, error);
                }
            }

            throw lastError || new Error('All providers failed');
        } catch (error) {
            console.error('Image upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                uploadDurationMs: Date.now() - startTime,
            };
        }
    }

    /**
     * Upload to a specific provider
     */
    private async uploadToProvider(
        provider: StorageProvider,
        file: ArrayBuffer,
        fileName: string,
        options?: {
            folder?: string;
            optimize?: boolean;
            generateVariants?: boolean;
        }
    ) {
        const providerInstance = this.router.getProvider(provider);
        if (!providerInstance) {
            throw new Error(`Provider ${provider} not available`);
        }

        const blob = new Blob([file]);
        return providerInstance.upload(blob, fileName, options);
    }

    /**
     * Get image by ID
     */
    async getImage(imageId: string): Promise<ImageMetadata | null> {
        return this.cache.getImage(imageId);
    }

    /**
     * Get optimized URL for an image
     */
    getOptimizedUrl(
        imageId: string,
        metadata: ImageMetadata,
        options?: {
            width?: number;
            height?: number;
            format?: 'webp' | 'avif' | 'jpg' | 'png';
            quality?: number;
        }
    ): string {
        // Return variant if available and matches size
        if (options?.width && metadata.variants) {
            if (options.width <= 150 && metadata.variants.thumbnail) {
                return metadata.variants.thumbnail;
            }
            if (options.width <= 300 && metadata.variants.small) {
                return metadata.variants.small;
            }
            if (options.width <= 600 && metadata.variants.medium) {
                return metadata.variants.medium;
            }
            if (options.width <= 1200 && metadata.variants.large) {
                return metadata.variants.large;
            }
        }

        // Generate dynamic URL using provider
        const provider = this.router.getProvider(metadata.storageProvider);
        if (provider && options) {
            return provider.getOptimizedUrl(metadata.originalUrl, options);
        }

        return metadata.cdnUrl || metadata.originalUrl;
    }

    /**
     * Delete an image
     */
    async deleteImage(imageId: string): Promise<boolean> {
        const metadata = await this.cache.getImage(imageId);
        if (!metadata) return false;

        // Delete from provider
        const provider = this.router.getProvider(metadata.storageProvider);
        if (provider && metadata.providerId) {
            await provider.delete(metadata.providerId).catch(console.error);
        }

        // Soft delete from database
        return this.cache.deleteImage(imageId);
    }

    /**
     * Get images for a restaurant
     */
    async getRestaurantImages(
        restaurantId: string,
        options?: {
            imageType?: ImageType;
            limit?: number;
            offset?: number;
        }
    ): Promise<ImageMetadata[]> {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );

        let query = supabase
            .from('image_metadata')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (options?.imageType) {
            query = query.eq('image_type', options.imageType);
        }

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        if (options?.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data.map(this.mapToImageMetadata);
    }

    /**
     * Get quota usage summary
     */
    async getQuotaUsage(restaurantId: string) {
        return this.quotaManager.getUsageSummary(restaurantId);
    }

    /**
     * Convert File/Blob to ArrayBuffer
     */
    private async fileToBuffer(file: File | Blob): Promise<ArrayBuffer> {
        return file.arrayBuffer();
    }

    private mapToImageMetadata(data: any): ImageMetadata {
        return {
            id: data.id,
            restaurantId: data.restaurant_id,
            storageProvider: data.storage_provider,
            imageType: data.image_type,
            originalUrl: data.original_url,
            cdnUrl: data.cdn_url,
            thumbnailUrl: data.thumbnail_url,
            providerId: data.provider_id,
            fileName: data.file_name,
            fileSizeBytes: data.file_size_bytes,
            mimeType: data.mime_type,
            width: data.width,
            height: data.height,
            variants: data.variants || {},
            altText: data.alt_text,
            caption: data.caption,
            cacheControl: data.cache_control,
            etag: data.etag,
            lastAccessedAt: data.last_accessed_at,
            accessCount: data.access_count || 0,
            status: data.status,
            errorMessage: data.error_message,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            deletedAt: data.deleted_at,
        };
    }

    /**
     * Get cache headers
     */
    getCacheHeaders(): Record<string, string> {
        return this.cache.getCacheHeaders();
    }
}

// Singleton
let serviceInstance: ImageStorageService | null = null;

export function getImageStorageService(): ImageStorageService {
    if (!serviceInstance) {
        serviceInstance = new ImageStorageService();
    }
    return serviceInstance;
}
