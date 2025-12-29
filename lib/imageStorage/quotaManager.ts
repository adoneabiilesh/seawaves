/**
 * Quota Manager
 * Track and manage storage provider quotas
 */

import { createClient } from '@supabase/supabase-js';
import { StorageProvider, ProviderQuota } from './types';

export class QuotaManager {
    private supabaseClient;
    private quotaCache: Map<string, { quota: ProviderQuota; timestamp: number }>;
    private readonly CACHE_TTL = 60000; // 1 minute

    // Default quota limits
    static readonly DEFAULT_QUOTAS: Record<StorageProvider, Partial<ProviderQuota>> = {
        cloudinary: {
            monthlyUploadLimitBytes: 10 * 1024 * 1024 * 1024, // 10GB
            monthlyRequestLimit: 50000,
            maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
            priority: 1,
        },
        firebase: {
            monthlyUploadLimitBytes: 5 * 1024 * 1024 * 1024, // 5GB
            monthlyRequestLimit: 25000,
            maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
            priority: 2,
        },
        supabase: {
            monthlyUploadLimitBytes: 1 * 1024 * 1024 * 1024, // 1GB
            monthlyRequestLimit: 10000,
            maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
            priority: 3,
        },
        google_photos: {
            monthlyUploadLimitBytes: 15 * 1024 * 1024 * 1024, // 15GB (Google quota)
            monthlyRequestLimit: 10000,
            maxFileSizeBytes: 75 * 1024 * 1024, // 75MB (Google limit)
            priority: 4,
        },
    };

    constructor() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        this.supabaseClient = createClient(supabaseUrl, supabaseKey);
        this.quotaCache = new Map();
    }

    /**
     * Initialize quotas for a new restaurant
     */
    async initializeRestaurantQuotas(restaurantId: string): Promise<void> {
        const providers: StorageProvider[] = ['cloudinary', 'firebase', 'supabase', 'google_photos'];

        for (const provider of providers) {
            const defaults = QuotaManager.DEFAULT_QUOTAS[provider];

            await this.supabaseClient
                .from('provider_quotas')
                .upsert({
                    restaurant_id: restaurantId,
                    provider,
                    monthly_upload_limit_bytes: defaults.monthlyUploadLimitBytes,
                    monthly_request_limit: defaults.monthlyRequestLimit,
                    max_file_size_bytes: defaults.maxFileSizeBytes,
                    priority: defaults.priority,
                    is_enabled: true,
                }, {
                    onConflict: 'restaurant_id,provider',
                });
        }
    }

    /**
     * Get quota for a specific provider
     */
    async getQuota(restaurantId: string, provider: StorageProvider): Promise<ProviderQuota | null> {
        const cacheKey = `${restaurantId}-${provider}`;
        const cached = this.quotaCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.quota;
        }

        const { data, error } = await this.supabaseClient
            .from('provider_quotas')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('provider', provider)
            .single();

        if (error || !data) return null;

        const quota = this.mapToProviderQuota(data);
        this.quotaCache.set(cacheKey, { quota, timestamp: Date.now() });

        return quota;
    }

    /**
     * Get all quotas for a restaurant
     */
    async getAllQuotas(restaurantId: string): Promise<ProviderQuota[]> {
        const { data, error } = await this.supabaseClient
            .from('provider_quotas')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('priority', { ascending: true });

        if (error || !data) return [];

        return data.map(this.mapToProviderQuota);
    }

    /**
     * Check if upload is allowed within quota
     */
    async canUpload(
        restaurantId: string,
        provider: StorageProvider,
        fileSizeBytes: number
    ): Promise<{ allowed: boolean; reason?: string }> {
        const quota = await this.getQuota(restaurantId, provider);

        if (!quota) {
            return { allowed: true }; // No quota set
        }

        if (!quota.isEnabled) {
            return { allowed: false, reason: 'Provider is disabled' };
        }

        if (fileSizeBytes > quota.maxFileSizeBytes) {
            return {
                allowed: false,
                reason: `File size ${this.formatBytes(fileSizeBytes)} exceeds limit of ${this.formatBytes(quota.maxFileSizeBytes)}`,
            };
        }

        if (quota.currentMonthBytes + fileSizeBytes > quota.monthlyUploadLimitBytes) {
            return {
                allowed: false,
                reason: `Monthly upload limit of ${this.formatBytes(quota.monthlyUploadLimitBytes)} would be exceeded`,
            };
        }

        if (quota.currentMonthRequests >= quota.monthlyRequestLimit) {
            return {
                allowed: false,
                reason: `Monthly request limit of ${quota.monthlyRequestLimit} requests reached`,
            };
        }

        return { allowed: true };
    }

    /**
     * Increment quota usage
     */
    async incrementUsage(
        restaurantId: string,
        provider: StorageProvider,
        bytes: number
    ): Promise<void> {
        await this.supabaseClient.rpc('increment_quota_usage', {
            p_restaurant_id: restaurantId,
            p_provider: provider,
            p_bytes: bytes,
        });

        // Invalidate cache
        this.quotaCache.delete(`${restaurantId}-${provider}`);
    }

    /**
     * Get quota usage summary
     */
    async getUsageSummary(restaurantId: string): Promise<{
        totalBytes: number;
        totalRequests: number;
        byProvider: Record<StorageProvider, { bytes: number; requests: number; percentUsed: number }>;
    }> {
        const quotas = await this.getAllQuotas(restaurantId);

        let totalBytes = 0;
        let totalRequests = 0;
        const byProvider: Record<string, { bytes: number; requests: number; percentUsed: number }> = {};

        for (const quota of quotas) {
            totalBytes += quota.currentMonthBytes;
            totalRequests += quota.currentMonthRequests;
            byProvider[quota.provider] = {
                bytes: quota.currentMonthBytes,
                requests: quota.currentMonthRequests,
                percentUsed: Math.round((quota.currentMonthBytes / quota.monthlyUploadLimitBytes) * 100),
            };
        }

        return { totalBytes, totalRequests, byProvider: byProvider as any };
    }

    /**
     * Reset monthly quotas (call from cron job)
     */
    async resetMonthlyQuotas(): Promise<number> {
        const { data, error } = await this.supabaseClient
            .from('provider_quotas')
            .update({
                current_month_bytes: 0,
                current_month_requests: 0,
                last_reset_at: new Date().toISOString(),
            })
            .neq('id', '00000000-0000-0000-0000-000000000000') // Match all
            .select();

        if (error) {
            console.error('Failed to reset quotas:', error);
            return 0;
        }

        // Clear cache
        this.quotaCache.clear();

        return data?.length || 0;
    }

    /**
     * Update quota limits
     */
    async updateQuotaLimits(
        restaurantId: string,
        provider: StorageProvider,
        limits: {
            monthlyUploadLimitBytes?: number;
            monthlyRequestLimit?: number;
            maxFileSizeBytes?: number;
            isEnabled?: boolean;
            priority?: number;
        }
    ): Promise<void> {
        const updateData: Record<string, any> = {};

        if (limits.monthlyUploadLimitBytes !== undefined) {
            updateData.monthly_upload_limit_bytes = limits.monthlyUploadLimitBytes;
        }
        if (limits.monthlyRequestLimit !== undefined) {
            updateData.monthly_request_limit = limits.monthlyRequestLimit;
        }
        if (limits.maxFileSizeBytes !== undefined) {
            updateData.max_file_size_bytes = limits.maxFileSizeBytes;
        }
        if (limits.isEnabled !== undefined) {
            updateData.is_enabled = limits.isEnabled;
        }
        if (limits.priority !== undefined) {
            updateData.priority = limits.priority;
        }

        await this.supabaseClient
            .from('provider_quotas')
            .update(updateData)
            .eq('restaurant_id', restaurantId)
            .eq('provider', provider);

        // Invalidate cache
        this.quotaCache.delete(`${restaurantId}-${provider}`);
    }

    private mapToProviderQuota(data: any): ProviderQuota {
        return {
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
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Singleton instance
let quotaManagerInstance: QuotaManager | null = null;

export function getQuotaManager(): QuotaManager {
    if (!quotaManagerInstance) {
        quotaManagerInstance = new QuotaManager();
    }
    return quotaManagerInstance;
}
