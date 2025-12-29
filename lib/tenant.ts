/**
 * Generate a URL-safe subdomain from a restaurant name
 * Example: "Pizzeria Roma" → "pizzeria-roma"
 */
export function generateSubdomain(restaurantName: string): string {
    return restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')  // Replace non-alphanumeric with dash
        .replace(/-+/g, '-')          // Replace multiple dashes with single
        .replace(/^-|-$/g, '');        // Remove leading/trailing dashes
}

/**
 * Validate subdomain format
 */
export function isValidSubdomain(subdomain: string): boolean {
    // Must be 3-30 characters, lowercase letters, numbers, and dashes only
    const regex = /^[a-z0-9-]{3,30}$/;
    return regex.test(subdomain);
}

/**
 * Check if subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
    const reserved = [
        'www',
        'api',
        'admin',
        'webhook',
        'app',
        'mail',
        'email',
        'support',
        'help',
        'blog',
        'docs',
        'status',
        'localhost'
    ];

    return reserved.includes(subdomain.toLowerCase());
}

/**
 * Extract subdomain from host header
 */
export function extractSubdomain(host: string): string | null {
    // Remove port if present
    const hostWithoutPort = host.split(':')[0];

    // Split by dots
    const parts = hostWithoutPort.split('.');

    // For localhost development (e.g., pizzeria-roma.localhost)
    if (hostWithoutPort.includes('localhost')) {
        if (parts.length > 1 && parts[1] === 'localhost') {
            return parts[0];
        }
        return null;
    }

    // For production (e.g., pizzeria-roma.yourplatform.com)
    // Assuming format: subdomain.domain.tld
    if (parts.length >= 3) {
        return parts[0];
    }

    // For main domain (e.g., yourplatform.com or www.yourplatform.com)
    return null;
}

/**
 * Get tenant ID from request headers (set by middleware)
 */
export function getTenantFromHeaders(headers: Headers): {
    subdomain: string | null;
    tenantId: string | null;
} {
    return {
        subdomain: headers.get('x-tenant'),
        tenantId: headers.get('x-tenant-id')
    };
}
