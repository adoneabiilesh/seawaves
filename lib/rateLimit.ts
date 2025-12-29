import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for API routes
// In production, use Redis for distributed rate limiting

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
};

export function rateLimit(
    request: NextRequest,
    config: RateLimitConfig = DEFAULT_CONFIG
): { success: boolean; remaining: number; reset: number } {
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    const now = Date.now();
    const key = `${ip}:${request.nextUrl.pathname}`;

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
        for (const [k, v] of rateLimitStore.entries()) {
            if (now > v.resetTime) {
                rateLimitStore.delete(k);
            }
        }
    }

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        entry = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        rateLimitStore.set(key, entry);
    } else {
        entry.count++;
    }

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const reset = entry.resetTime;

    return {
        success: entry.count <= config.maxRequests,
        remaining,
        reset,
    };
}

export function rateLimitResponse(reset: number): NextResponse {
    return NextResponse.json(
        {
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
                'X-RateLimit-Reset': String(reset),
            },
        }
    );
}

// Middleware helper for API routes
export function withRateLimit(
    handler: (request: NextRequest) => Promise<NextResponse>,
    config?: RateLimitConfig
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const { success, remaining, reset } = rateLimit(request, config);

        if (!success) {
            return rateLimitResponse(reset);
        }

        const response = await handler(request);

        // Add rate limit headers to response
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        response.headers.set('X-RateLimit-Reset', String(reset));

        return response;
    };
}

// Strict rate limit for sensitive operations (login, payment)
export const STRICT_RATE_LIMIT: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
};

// Relaxed rate limit for read operations
export const RELAXED_RATE_LIMIT: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300, // 300 requests per minute
};
