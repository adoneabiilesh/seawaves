-- =============================================================================
-- IMAGE STORAGE SYSTEM - PRODUCTION SCHEMA
-- Multi-provider image storage with Cloudinary, Firebase, Supabase, Google Photos
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- STORAGE PROVIDERS ENUM
-- =============================================================================
DO $$ BEGIN
    CREATE TYPE storage_provider AS ENUM ('cloudinary', 'firebase', 'supabase', 'google_photos');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE image_type AS ENUM ('product', 'profile', 'logo', 'icon', 'user_photo', 'menu_scan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE upload_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- IMAGE METADATA TABLE
-- Central registry for all uploaded images across all providers
-- =============================================================================
CREATE TABLE IF NOT EXISTS image_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id TEXT,  -- TEXT to match Restaurant.id type
    
    -- Storage Information
    storage_provider storage_provider NOT NULL,
    image_type image_type NOT NULL,
    
    -- URLs and Identifiers
    original_url TEXT NOT NULL,
    cdn_url TEXT,                          -- Optimized CDN URL
    thumbnail_url TEXT,                    -- Thumbnail for lists
    provider_id TEXT,                      -- Provider-specific ID (e.g., Cloudinary public_id)
    
    -- File Information
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    
    -- Optimization Variants (different sizes for mobile)
    variants JSONB DEFAULT '{}',           -- { "small": "url", "medium": "url", "large": "url" }
    
    -- Metadata
    alt_text TEXT,
    caption TEXT,
    
    -- Cache Control
    cache_control TEXT DEFAULT 'public, max-age=2592000',  -- 30 days
    etag TEXT,
    last_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    
    -- Status
    status upload_status DEFAULT 'pending',
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft Delete
    deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_metadata_restaurant ON image_metadata(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_image_metadata_provider ON image_metadata(storage_provider);
CREATE INDEX IF NOT EXISTS idx_image_metadata_type ON image_metadata(image_type);
CREATE INDEX IF NOT EXISTS idx_image_metadata_status ON image_metadata(status);
CREATE INDEX IF NOT EXISTS idx_image_metadata_created ON image_metadata(created_at DESC);

-- =============================================================================
-- PROVIDER QUOTAS TABLE
-- Track usage and limits for each storage provider per restaurant
-- =============================================================================
CREATE TABLE IF NOT EXISTS provider_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id TEXT NOT NULL,  -- TEXT to match Restaurant.id type
    provider storage_provider NOT NULL,
    
    -- Quota Limits (configurable per plan)
    monthly_upload_limit_bytes BIGINT DEFAULT 5368709120,    -- 5GB default
    monthly_request_limit INTEGER DEFAULT 10000,              -- 10k requests
    max_file_size_bytes INTEGER DEFAULT 10485760,            -- 10MB max file
    
    -- Current Usage (reset monthly)
    current_month_bytes BIGINT DEFAULT 0,
    current_month_requests INTEGER DEFAULT 0,
    last_reset_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Lifetime Stats
    total_bytes_uploaded BIGINT DEFAULT 0,
    total_uploads INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,                               -- Lower = higher priority
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(restaurant_id, provider)
);

-- Index for quota lookups
CREATE INDEX IF NOT EXISTS idx_provider_quotas_restaurant ON provider_quotas(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_provider_quotas_priority ON provider_quotas(restaurant_id, priority);

-- =============================================================================
-- IMAGE CACHE TABLE
-- App-level cache metadata for frequently accessed images
-- =============================================================================
CREATE TABLE IF NOT EXISTS image_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID REFERENCES image_metadata(id) ON DELETE CASCADE,
    
    -- Cache Key (composite for fast lookups)
    cache_key TEXT UNIQUE NOT NULL,
    
    -- Cached Data
    cached_url TEXT NOT NULL,
    cached_variants JSONB DEFAULT '{}',
    
    -- TTL and Expiry
    ttl_seconds INTEGER DEFAULT 3600,                        -- 1 hour default
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Stats
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_cache_key ON image_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_image_cache_expires ON image_cache(expires_at);

-- =============================================================================
-- UPDATE PRODUCT TABLE
-- Add pairings column for food/drink recommendations
-- =============================================================================
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS pairings JSONB DEFAULT '{"drinks": [], "foods": []}';

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS image_id UUID REFERENCES image_metadata(id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Restaurant can view own images" ON image_metadata;
DROP POLICY IF EXISTS "Restaurant can insert own images" ON image_metadata;
DROP POLICY IF EXISTS "Restaurant can update own images" ON image_metadata;
DROP POLICY IF EXISTS "Restaurant can delete own images" ON image_metadata;
DROP POLICY IF EXISTS "Restaurant can view own quotas" ON provider_quotas;
DROP POLICY IF EXISTS "Restaurant can update own quotas" ON provider_quotas;

-- Policies for image_metadata
CREATE POLICY "Restaurant can view own images" ON image_metadata
    FOR SELECT USING (
        restaurant_id IN (
            SELECT id FROM "Restaurant" WHERE id = restaurant_id
        ) OR restaurant_id IS NULL
    );

CREATE POLICY "Restaurant can insert own images" ON image_metadata
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT id FROM "Restaurant" WHERE id = restaurant_id
        ) OR restaurant_id IS NULL
    );

CREATE POLICY "Restaurant can update own images" ON image_metadata
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT id FROM "Restaurant" WHERE id = restaurant_id
        )
    );

CREATE POLICY "Restaurant can delete own images" ON image_metadata
    FOR DELETE USING (
        restaurant_id IN (
            SELECT id FROM "Restaurant" WHERE id = restaurant_id
        )
    );

-- Policies for provider_quotas
CREATE POLICY "Restaurant can view own quotas" ON provider_quotas
    FOR SELECT USING (
        restaurant_id IN (
            SELECT id FROM "Restaurant" WHERE id = restaurant_id
        )
    );

CREATE POLICY "Restaurant can update own quotas" ON provider_quotas
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT id FROM "Restaurant" WHERE id = restaurant_id
        )
    );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to check if provider has quota available
CREATE OR REPLACE FUNCTION check_provider_quota(
    p_restaurant_id UUID,
    p_provider storage_provider,
    p_file_size_bytes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    quota_record RECORD;
BEGIN
    SELECT * INTO quota_record
    FROM provider_quotas
    WHERE restaurant_id = p_restaurant_id 
      AND provider = p_provider
      AND is_enabled = true;
    
    IF NOT FOUND THEN
        RETURN true;  -- No quota set, allow upload
    END IF;
    
    -- Check file size limit
    IF p_file_size_bytes > quota_record.max_file_size_bytes THEN
        RETURN false;
    END IF;
    
    -- Check monthly byte limit
    IF quota_record.current_month_bytes + p_file_size_bytes > quota_record.monthly_upload_limit_bytes THEN
        RETURN false;
    END IF;
    
    -- Check monthly request limit
    IF quota_record.current_month_requests >= quota_record.monthly_request_limit THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment quota usage
CREATE OR REPLACE FUNCTION increment_quota_usage(
    p_restaurant_id UUID,
    p_provider storage_provider,
    p_bytes INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO provider_quotas (restaurant_id, provider, current_month_bytes, current_month_requests, total_bytes_uploaded, total_uploads)
    VALUES (p_restaurant_id, p_provider, p_bytes, 1, p_bytes, 1)
    ON CONFLICT (restaurant_id, provider) DO UPDATE SET
        current_month_bytes = provider_quotas.current_month_bytes + p_bytes,
        current_month_requests = provider_quotas.current_month_requests + 1,
        total_bytes_uploaded = provider_quotas.total_bytes_uploaded + p_bytes,
        total_uploads = provider_quotas.total_uploads + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get best available provider based on quota and priority
CREATE OR REPLACE FUNCTION get_best_provider(
    p_restaurant_id UUID,
    p_image_type image_type,
    p_file_size_bytes INTEGER
) RETURNS storage_provider AS $$
DECLARE
    provider_record RECORD;
    default_provider storage_provider;
BEGIN
    -- Default routing based on image type
    CASE p_image_type
        WHEN 'product', 'menu_scan' THEN default_provider := 'cloudinary';
        WHEN 'profile', 'user_photo' THEN default_provider := 'firebase';
        WHEN 'logo', 'icon' THEN default_provider := 'supabase';
        ELSE default_provider := 'cloudinary';
    END CASE;
    
    -- Check if default provider has quota
    IF check_provider_quota(p_restaurant_id, default_provider, p_file_size_bytes) THEN
        RETURN default_provider;
    END IF;
    
    -- Find alternative provider with available quota
    FOR provider_record IN
        SELECT provider FROM provider_quotas
        WHERE restaurant_id = p_restaurant_id
          AND is_enabled = true
        ORDER BY priority ASC
    LOOP
        IF check_provider_quota(p_restaurant_id, provider_record.provider, p_file_size_bytes) THEN
            RETURN provider_record.provider;
        END IF;
    END LOOP;
    
    -- Fallback to supabase (usually has most lenient limits)
    RETURN 'supabase';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS image_metadata_updated_at ON image_metadata;
CREATE TRIGGER image_metadata_updated_at
    BEFORE UPDATE ON image_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS provider_quotas_updated_at ON provider_quotas;
CREATE TRIGGER provider_quotas_updated_at
    BEFORE UPDATE ON provider_quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
