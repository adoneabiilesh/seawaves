/**
 * Smart Image Router
 * Routes uploads to optimal provider based on image type, size, and quota
 */

import { createClient } from '@supabase/supabase-js';
import {
    StorageProvider,
    ImageType,
    RoutingDecision,
    RoutingRules,
    StorageProviderInterface,
    ProviderQuota,
} from './types';
import {
    getCloudinaryProvider,
    getFirebaseProvider,
    getSupabaseStorageProvider,
    getGooglePhotosProvider,
} from './providers';

// Default routing rules based on image type
const DEFAULT_ROUTING_RULES: RoutingRules = {
    product: 'cloudinary',      // High traffic, needs CDN
    profile: 'firebase',        // Medium traffic
    logo: 'supabase',          // Small files
    icon: 'supabase',          // Small files
    user_photo: 'google_photos', // Backup storage
    menu_scan: 'cloudinary',    // Needs OCR/AI processing
};

// Fallback chain for each provider
const FALLBACK_CHAIN: Record<StorageProvider, StorageProvider[]> = {
    cloudinary: ['firebase', 'supabase'],
    firebase: ['supabase', 'cloudinary'],
    supabase: ['firebase', 'cloudinary'],
    google_photos: ['firebase', 'supabase'],
};

// Size thresholds
const SIZE_THRESHOLDS = {
    small: 100 * 1024,      // 100KB - use Supabase
    medium: 1024 * 1024,    // 1MB
    large: 5 * 1024 * 1024, // 5MB
};

export class ImageRouter {
    private supabaseClient;
    private providers: Map<StorageProvider, StorageProviderInterface>;
    private quotaCache: Map<string, { quota: ProviderQuota; timestamp: number }>;
    private readonly QUOTA_CACHE_TTL = 60000; // 1 minute

    constructor() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        this.supabaseClient = createClient(supabaseUrl, supabaseKey);
        this.providers = new Map();
        this.quotaCache = new Map();

        // Initialize providers
        this.providers.set('cloudinary', getCloudinaryProvider());
        this.providers.set('firebase', getFirebaseProvider());
        this.providers.set('supabase', getSupabaseStorageProvider());
        this.providers.set('google_photos', getGooglePhotosProvider());
    }

    /**
     * Get the optimal provider for an upload
     */
    async getOptimalProvider(
        imageType: ImageType,
        fileSizeBytes: number,
        restaurantId: string
    ): Promise<RoutingDecision> {
        // Step 1: Determine default provider based on image type
        let primaryProvider = DEFAULT_ROUTING_RULES[imageType];

        // Step 2: Override for small files - route to Supabase
        if (fileSizeBytes < SIZE_THRESHOLDS.small) {
            primaryProvider = 'supabase';
        }

        // Step 3: Check if primary provider is available and has quota
        const canUsePrimary = await this.checkProviderAvailability(
            primaryProvider,
            restaurantId,
            fileSizeBytes
        );

        if (canUsePrimary) {
            return {
                provider: primaryProvider,
                fallbackProviders: FALLBACK_CHAIN[primaryProvider],
                reason: `Default provider for ${imageType}`,
            };
        }

        // Step 4: Find first available fallback
        for (const fallback of FALLBACK_CHAIN[primaryProvider]) {
            const canUseFallback = await this.checkProviderAvailability(
                fallback,
                restaurantId,
                fileSizeBytes
            );

            if (canUseFallback) {
                return {
                    provider: fallback,
                    fallbackProviders: FALLBACK_CHAIN[fallback].filter(p => p !== primaryProvider),
                    reason: `Fallback: ${primaryProvider} unavailable or at quota`,
                };
            }
        }

        // Step 5: Last resort - use Supabase (usually most available)
        return {
            provider: 'supabase',
            fallbackProviders: [],
            reason: 'Last resort fallback',
        };
    }

    /**
     * Check if a provider is available and has quota
     */
    private async checkProviderAvailability(
        provider: StorageProvider,
        restaurantId: string,
        fileSizeBytes: number
    ): Promise<boolean> {
        // Check provider health
        const providerInstance = this.providers.get(provider);
        if (!providerInstance) return false;

        const isAvailable = await providerInstance.isAvailable().catch(() => false);
        if (!isAvailable) return false;

        // Check quota
        const quota = await this.getProviderQuota(restaurantId, provider);
        if (!quota) return true; // No quota set, allow

        if (!quota.isEnabled) return false;
        if (fileSizeBytes > quota.maxFileSizeBytes) return false;
        if (quota.currentMonthBytes + fileSizeBytes > quota.monthlyUploadLimitBytes) return false;
        if (quota.currentMonthRequests >= quota.monthlyRequestLimit) return false;

        return true;
    }

    /**
     * Get quota for a provider (with caching)
     */
    private async getProviderQuota(
        restaurantId: string,
        provider: StorageProvider
    ): Promise<ProviderQuota | null> {
        const cacheKey = `${restaurantId}-${provider}`;
        const cached = this.quotaCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.QUOTA_CACHE_TTL) {
            return cached.quota;
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('provider_quotas')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('provider', provider)
                .single();

            if (error || !data) return null;

            const quota: ProviderQuota = {
                id: data.id,
                restaurantId: data.restaurant_id,
                provider: data.provider,
                monthlyUploadLimitBytes: data.monthly_upload_limit_bytes,
                monthlyRequestLimit: data.monthly_request_limit,
                maxFileSizeBytes: data.max_file_size_bytes,
                currentMonthBytes: data.current_month_bytes,
                currentMonthRequests: data.current_month_requests,
                lastResetAt: data.last_reset_at,
                totalBytesUploaded: data.total_bytes_uploaded,
                totalUploads: data.total_uploads,
                totalRequests: data.total_requests,
                isEnabled: data.is_enabled,
                priority: data.priority,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };

            this.quotaCache.set(cacheKey, { quota, timestamp: Date.now() });
            return quota;
        } catch {
            return null;
        }
    }

    /**
     * Increment quota usage after successful upload
     */
    async incrementQuotaUsage(
        restaurantId: string,
        provider: StorageProvider,
        bytes: number
    ): Promise<void> {
        try {
            await this.supabaseClient.rpc('increment_quota_usage', {
                p_restaurant_id: restaurantId,
                p_provider: provider,
                p_bytes: bytes,
            });

            // Invalidate cache
            this.quotaCache.delete(`${restaurantId}-${provider}`);
        } catch (error) {
            console.error('Failed to increment quota usage:', error);
        }
    }

    /**
     * Get provider instance
     */
    getProvider(provider: StorageProvider): StorageProviderInterface | undefined {
        return this.providers.get(provider);
    }
}

// Singleton instance
let routerInstance: ImageRouter | null = null;

export function getImageRouter(): ImageRouter {
    if (!routerInstance) {
        routerInstance = new ImageRouter();
    }
    return routerInstance;
}
