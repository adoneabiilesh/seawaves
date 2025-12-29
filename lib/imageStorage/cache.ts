/**
 * Image Cache Manager
 * 3-layer caching: In-memory → Browser → CDN
 */

import { createClient } from '@supabase/supabase-js';
import {
    ImageMetadata,
    ImageVariants,
    CacheEntry,
    CacheConfig,
    StorageProvider,
} from './types';

// LRU Cache implementation for in-memory caching
class LRUCache<T> {
    private cache: Map<string, { value: T; timestamp: number }>;
    private maxSize: number;
    private ttlMs: number;

    constructor(maxSize: number, ttlSeconds: number) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlSeconds * 1000;
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }

    set(key: string, value: T): void {
        // Remove if exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(key, { value, timestamp: Date.now() });
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

export class ImageCacheManager {
    private inMemoryCache: LRUCache<ImageMetadata>;
    private supabaseClient;
    private config: CacheConfig;

    constructor(config?: Partial<CacheConfig>) {
        this.config = {
            inMemoryMaxItems: config?.inMemoryMaxItems || 100,
            inMemoryTtlSeconds: config?.inMemoryTtlSeconds || 3600, // 1 hour
            browserCacheMaxAge: config?.browserCacheMaxAge || 2592000, // 30 days
            cdnCacheMaxAge: config?.cdnCacheMaxAge || 86400, // 1 day
        };

        this.inMemoryCache = new LRUCache(
            this.config.inMemoryMaxItems,
            this.config.inMemoryTtlSeconds
        );

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        this.supabaseClient = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Get image from cache (memory → database → null)
     */
    async getImage(imageId: string): Promise<ImageMetadata | null> {
        // Layer 1: In-memory cache
        const cached = this.inMemoryCache.get(imageId);
        if (cached) {
            this.trackAccess(imageId);
            return cached;
        }

        // Layer 2: Database
        try {
            const { data, error } = await this.supabaseClient
                .from('image_metadata')
                .select('*')
                .eq('id', imageId)
                .is('deleted_at', null)
                .single();

            if (error || !data) return null;

            const metadata = this.mapToImageMetadata(data);

            // Store in memory cache
            this.inMemoryCache.set(imageId, metadata);
            this.trackAccess(imageId);

            return metadata;
        } catch {
            return null;
        }
    }

    /**
     * Get image by URL
     */
    async getImageByUrl(url: string): Promise<ImageMetadata | null> {
        try {
            const { data, error } = await this.supabaseClient
                .from('image_metadata')
                .select('*')
                .or(`original_url.eq.${url},cdn_url.eq.${url}`)
                .is('deleted_at', null)
                .single();

            if (error || !data) return null;

            const metadata = this.mapToImageMetadata(data);
            this.inMemoryCache.set(data.id, metadata);

            return metadata;
        } catch {
            return null;
        }
    }

    /**
     * Store image metadata
     */
    async storeImage(metadata: Omit<ImageMetadata, 'id' | 'createdAt' | 'updatedAt'>): Promise<ImageMetadata> {
        const { data, error } = await this.supabaseClient
            .from('image_metadata')
            .insert({
                restaurant_id: metadata.restaurantId,
                storage_provider: metadata.storageProvider,
                image_type: metadata.imageType,
                original_url: metadata.originalUrl,
                cdn_url: metadata.cdnUrl,
                thumbnail_url: metadata.thumbnailUrl,
                provider_id: metadata.providerId,
                file_name: metadata.fileName,
                file_size_bytes: metadata.fileSizeBytes,
                mime_type: metadata.mimeType,
                width: metadata.width,
                height: metadata.height,
                variants: metadata.variants,
                alt_text: metadata.altText,
                caption: metadata.caption,
                cache_control: metadata.cacheControl,
                status: metadata.status,
                error_message: metadata.errorMessage,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to store image metadata: ${error.message}`);
        }

        const storedMetadata = this.mapToImageMetadata(data);
        this.inMemoryCache.set(storedMetadata.id, storedMetadata);

        return storedMetadata;
    }

    /**
     * Update image metadata
     */
    async updateImage(
        imageId: string,
        updates: Partial<ImageMetadata>
    ): Promise<ImageMetadata> {
        const updateData: Record<string, any> = {};

        if (updates.cdnUrl) updateData.cdn_url = updates.cdnUrl;
        if (updates.thumbnailUrl) updateData.thumbnail_url = updates.thumbnailUrl;
        if (updates.variants) updateData.variants = updates.variants;
        if (updates.altText) updateData.alt_text = updates.altText;
        if (updates.caption) updateData.caption = updates.caption;
        if (updates.status) updateData.status = updates.status;
        if (updates.errorMessage) updateData.error_message = updates.errorMessage;

        const { data, error } = await this.supabaseClient
            .from('image_metadata')
            .update(updateData)
            .eq('id', imageId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update image metadata: ${error.message}`);
        }

        const metadata = this.mapToImageMetadata(data);

        // Update cache
        this.inMemoryCache.set(imageId, metadata);

        return metadata;
    }

    /**
     * Delete image (soft delete)
     */
    async deleteImage(imageId: string): Promise<boolean> {
        const { error } = await this.supabaseClient
            .from('image_metadata')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', imageId);

        if (error) return false;

        this.inMemoryCache.delete(imageId);
        return true;
    }

    /**
     * Get cache headers for HTTP response
     */
    getCacheHeaders(): Record<string, string> {
        return {
            'Cache-Control': `public, max-age=${this.config.browserCacheMaxAge}, immutable`,
            'Vary': 'Accept',
        };
    }

    /**
     * Track image access for analytics
     */
    private async trackAccess(imageId: string): Promise<void> {
        // Fire and forget - don't block the response
        this.supabaseClient
            .from('image_metadata')
            .update({
                access_count: this.supabaseClient.rpc('increment_access_count', { row_id: imageId }),
                last_accessed_at: new Date().toISOString(),
            })
            .eq('id', imageId)
            .then(() => { })
            .catch(() => { });
    }

    /**
     * Map database row to ImageMetadata
     */
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
     * Clear all caches
     */
    clearCache(): void {
        this.inMemoryCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { inMemorySize: number; config: CacheConfig } {
        return {
            inMemorySize: this.inMemoryCache.size(),
            config: this.config,
        };
    }
}

// Singleton instance
let cacheManagerInstance: ImageCacheManager | null = null;

export function getImageCacheManager(config?: Partial<CacheConfig>): ImageCacheManager {
    if (!cacheManagerInstance || config) {
        cacheManagerInstance = new ImageCacheManager(config);
    }
    return cacheManagerInstance;
}
