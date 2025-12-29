import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export async function rateLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
        });
        return true;
    }

    if (record.count >= MAX_REQUESTS) {
        return false;
    }

    record.count++;
    return true;
}

// Middleware for API rate limiting
export async function withRateLimit(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const allowed = await rateLimit(ip);

    if (!allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        );
    }

    return handler(req);
}

// Middleware for authentication
export async function withAuth(
    handler: (req: NextRequest, session: any) => Promise<NextResponse>
): Promise<(req: NextRequest) => Promise<NextResponse>> {
    return async (req: NextRequest) => {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return handler(req, session);
    };
}

// Middleware for role-based access
export async function withRole(
    roles: string[],
    handler: (req: NextRequest, session: any) => Promise<NextResponse>
): Promise<(req: NextRequest) => Promise<NextResponse>> {
    return async (req: NextRequest) => {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRoles = (session.user as any).restaurantRoles || [];
        const hasRole = userRoles.some((r: any) => roles.includes(r.role));

        if (!hasRole) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return handler(req, session);
    };
}

// Input sanitization
export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .trim();
}

// Audit logging helper
export async function logAudit(data: {
    restaurantId: string;
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
}) {
    try {
        const { supabaseAdmin } = await import('./db');

        await supabaseAdmin.from('AuditLog').insert({
            restaurantId: data.restaurantId,
            userId: data.userId,
            action: data.action,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            changes: data.changes,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
}
