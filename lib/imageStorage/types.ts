/**
 * Image Storage System - TypeScript Types
 * Production-ready types for multi-provider image storage
 */

// =============================================================================
// ENUMS
// =============================================================================

export type StorageProvider = 'cloudinary' | 'firebase' | 'supabase' | 'google_photos';

export type ImageType = 'product' | 'profile' | 'logo' | 'icon' | 'user_photo' | 'menu_scan';

export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

// =============================================================================
// IMAGE VARIANTS
// =============================================================================

export interface ImageVariants {
    thumbnail?: string;  // 150x150
    small?: string;      // 300x300
    medium?: string;     // 600x600
    large?: string;      // 1200x1200
    original?: string;   // Original size
}

// =============================================================================
// IMAGE METADATA
// =============================================================================

export interface ImageMetadata {
    id: string;
    restaurantId?: string;

    // Storage Information
    storageProvider: StorageProvider;
    imageType: ImageType;

    // URLs
    originalUrl: string;
    cdnUrl?: string;
    thumbnailUrl?: string;
    providerId?: string;

    // File Information
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    width?: number;
    height?: number;

    // Variants
    variants: ImageVariants;

    // Metadata
    altText?: string;
    caption?: string;

    // Cache Control
    cacheControl: string;
    etag?: string;
    lastAccessedAt?: string;
    accessCount: number;

    // Status
    status: UploadStatus;
    errorMessage?: string;

    // Timestamps
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

// =============================================================================
// PROVIDER QUOTAS
// =============================================================================

export interface ProviderQuota {
    id: string;
    restaurantId: string;
    provider: StorageProvider;

    // Limits
    monthlyUploadLimitBytes: number;
    monthlyRequestLimit: number;
    maxFileSizeBytes: number;

    // Current Usage
    currentMonthBytes: number;
    currentMonthRequests: number;
    lastResetAt: string;

    // Lifetime Stats
    totalBytesUploaded: number;
    totalUploads: number;
    totalRequests: number;

    // Status
    isEnabled: boolean;
    priority: number;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// UPLOAD REQUEST/RESPONSE
// =============================================================================

export interface UploadRequest {
    file: File | Blob;
    imageType: ImageType;
    restaurantId: string;

    // Optional metadata
    altText?: string;
    caption?: string;

    // Optimization options
    optimize?: boolean;
    generateVariants?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;  // 1-100
}

export interface UploadResponse {
    success: boolean;
    image?: ImageMetadata;
    error?: string;

    // Performance metrics
    uploadDurationMs?: number;
    provider?: StorageProvider;
    originalSize?: number;
    optimizedSize?: number;
}

// =============================================================================
// PROVIDER CONFIG
// =============================================================================

export interface CloudinaryConfig {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadPreset?: string;
    folder?: string;
}

export interface FirebaseConfig {
    projectId: string;
    storageBucket: string;
    apiKey: string;
    authDomain?: string;
}

export interface SupabaseStorageConfig {
    url: string;
    anonKey: string;
    bucket: string;
}

export interface GooglePhotosConfig {
    clientId: string;
    clientSecret: string;
    refreshToken?: string;
}

export interface StorageConfig {
    cloudinary?: CloudinaryConfig;
    firebase?: FirebaseConfig;
    supabase?: SupabaseStorageConfig;
    googlePhotos?: GooglePhotosConfig;
}

// =============================================================================
// PROVIDER INTERFACE
// =============================================================================

export interface ImageUploadResult {
    url: string;
    providerId: string;
    variants?: ImageVariants;
    width?: number;
    height?: number;
}

export interface StorageProviderInterface {
    name: StorageProvider;

    upload(
        file: Buffer | Blob,
        fileName: string,
        options?: {
            folder?: string;
            optimize?: boolean;
            generateVariants?: boolean;
        }
    ): Promise<ImageUploadResult>;

    delete(providerId: string): Promise<boolean>;

    getOptimizedUrl(
        url: string,
        options?: {
            width?: number;
            height?: number;
            quality?: number;
            format?: 'webp' | 'avif' | 'jpg' | 'png';
        }
    ): string;

    isAvailable(): Promise<boolean>;
}

// =============================================================================
// CACHE TYPES
// =============================================================================

export interface CacheEntry {
    imageId: string;
    cacheKey: string;
    cachedUrl: string;
    cachedVariants: ImageVariants;
    ttlSeconds: number;
    expiresAt: string;
    hitCount: number;
    lastHitAt?: string;
    createdAt: string;
}

export interface CacheConfig {
    inMemoryMaxItems: number;
    inMemoryTtlSeconds: number;
    browserCacheMaxAge: number;
    cdnCacheMaxAge: number;
}

// =============================================================================
// ROUTING TYPES
// =============================================================================

export interface RoutingDecision {
    provider: StorageProvider;
    fallbackProviders: StorageProvider[];
    reason: string;
}

export interface RoutingRules {
    product: StorageProvider;
    profile: StorageProvider;
    logo: StorageProvider;
    icon: StorageProvider;
    user_photo: StorageProvider;
    menu_scan: StorageProvider;
}

// =============================================================================
// PRODUCT PAIRINGS (for AI recommendations)
// =============================================================================

export interface ProductPairings {
    drinks: string[];
    foods: string[];
}
