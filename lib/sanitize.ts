/**
 * Input Sanitization Utilities
 * Protects against XSS, SQL injection, and other input-based attacks
 */

// HTML entity encoding to prevent XSS
export function escapeHtml(text: string): string {
    if (!text || typeof text !== 'string') return '';

    const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
    };

    return text.replace(/[&<>"'`=/]/g, char => htmlEntities[char] || char);
}

// Strip all HTML tags
export function stripHtml(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/<[^>]*>/g, '');
}

// Sanitize for database queries (basic protection)
export function sanitizeForDb(text: string): string {
    if (!text || typeof text !== 'string') return '';
    // Remove null bytes and escape quotes
    return text
        .replace(/\0/g, '')
        .replace(/'/g, "''")
        .replace(/\\/g, '\\\\');
}

// Sanitize email address
export function sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    // Remove any non-email characters and trim
    return email.toLowerCase().trim().replace(/[^\w@.+-]/g, '');
}

// Sanitize phone number
export function sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';
    // Keep only digits, +, -, spaces, and parentheses
    return phone.replace(/[^\d+\-\s()]/g, '').trim();
}

// Sanitize username/name
export function sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') return '';
    // Remove control characters and limit length
    return stripHtml(name)
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim()
        .slice(0, 100);
}

// Sanitize URL
export function sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';

    try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }
        return parsed.href;
    } catch {
        return '';
    }
}

// Sanitize for JSON output
export function sanitizeForJson(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return escapeHtml(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeForJson);
    }

    if (typeof obj === 'object') {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[escapeHtml(key)] = sanitizeForJson(value);
        }
        return sanitized;
    }

    return obj;
}

// Validate and sanitize order notes/special requests
export function sanitizeOrderNotes(notes: string): string {
    if (!notes || typeof notes !== 'string') return '';

    return stripHtml(notes)
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .trim()
        .slice(0, 500); // Limit length
}

// Sanitize search query
export function sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') return '';

    return stripHtml(query)
        .replace(/[^\w\s-]/g, '') // Only allow word chars, spaces, hyphens
        .trim()
        .slice(0, 100);
}

// Validate numeric input
export function sanitizeNumber(value: any, min?: number, max?: number): number {
    const num = parseFloat(value);

    if (isNaN(num)) return 0;

    let result = num;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);

    return result;
}

// Sanitize UUID
export function sanitizeUuid(uuid: string): string | null {
    if (!uuid || typeof uuid !== 'string') return null;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleaned = uuid.trim().toLowerCase();

    return uuidRegex.test(cleaned) ? cleaned : null;
}
