import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/plans - Get all subscription plans
export async function GET() {
    try {
        const { data: plans, error } = await supabaseAdmin
            .from('SubscriptionPlan')
            .select('*')
            .eq('isActive', true)
            .order('sortOrder', { ascending: true });

        if (error) {
            // Return default plans if table doesn't exist yet
            return NextResponse.json({
                plans: [
                    {
                        id: 'starter',
                        name: 'Starter',
                        slug: 'starter',
                        regularPrice: 29,
                        offerPrice: 10,
                        description: 'Perfect for small restaurants getting started',
                        features: ['AI Menu Scanner', 'Up to 50 products', '5 Tables', 'QR Code ordering', 'Basic analytics'],
                        limits: { maxProducts: 50, maxTables: 5, aiScansPerMonth: 10 }
                    },
                    {
                        id: 'pro',
                        name: 'Pro',
                        slug: 'pro',
                        regularPrice: 60,
                        offerPrice: 29,
                        description: 'For growing restaurants with advanced needs',
                        features: ['Everything in Starter', 'Unlimited products', '25 Tables', 'Advanced AI features', 'Full analytics', 'Priority support'],
                        limits: { maxProducts: -1, maxTables: 25, aiScansPerMonth: 100 }
                    },
                    {
                        id: 'enterprise',
                        name: 'Enterprise',
                        slug: 'enterprise',
                        regularPrice: 100,
                        offerPrice: 79,
                        description: 'Complete solution for multi-location restaurants',
                        features: ['Everything in Pro', 'Unlimited tables', 'Multi-location', 'API access', 'Dedicated support', 'Custom integrations'],
                        limits: { maxProducts: -1, maxTables: -1, aiScansPerMonth: -1 }
                    }
                ]
            });
        }

        return NextResponse.json({ plans });
    } catch (error) {
        console.error('Plans API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
