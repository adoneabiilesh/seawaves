import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { subdomain } = body;

        if (!subdomain) {
            return NextResponse.json(
                { error: 'Subdomain required' },
                { status: 400 }
            );
        }

        // Validate format
        if (!/^[a-z0-9-]{3,30}$/.test(subdomain)) {
            return NextResponse.json({
                available: false,
                error: 'Invalid format. Use lowercase letters, numbers, and dashes (3-30 characters).'
            });
        }

        // Check reserved subdomains
        const reserved = ['www', 'api', 'admin', 'webhook', 'app', 'mail', 'email', 'support', 'help', 'blog', 'docs', 'status'];
        if (reserved.includes(subdomain.toLowerCase())) {
            return NextResponse.json({
                available: false,
                error: 'This subdomain is reserved'
            });
        }

        // Check if exists
        const { data: existing } = await supabaseAdmin
            .from('Restaurant')
            .select('id')
            .eq('subdomain', subdomain)
            .single();

        if (existing) {
            return NextResponse.json({
                available: false,
                error: 'Subdomain already taken'
            });
        }

        return NextResponse.json({
            available: true,
            subdomain
        });

    } catch (error) {
        console.error('Subdomain check error:', error);
        return NextResponse.json(
            { error: 'Failed to check subdomain' },
            { status: 500 }
        );
    }
}

