import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { restaurantId } = body;

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID required' },
                { status: 400 }
            );
        }

        // Verify user is owner
        const { data: userRole } = await supabaseAdmin
            .from('RestaurantRole')
            .select('role')
            .eq('userId', session.user.id)
            .eq('restaurantId', restaurantId)
            .eq('status', 'accepted')
            .single();

        if (!userRole || userRole.role !== 'owner') {
            return NextResponse.json(
                { error: 'Only owners can connect Stripe' },
                { status: 403 }
            );
        }

        // Create Stripe Connect account link
        const { data: restaurant } = await supabaseAdmin
            .from('Restaurant')
            .select('stripeAccountId')
            .eq('id', restaurantId)
            .single();

        let accountId = restaurant?.stripeAccountId;

        // Create account if doesn't exist
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });
            accountId = account.id;

            // Save account ID
            await supabaseAdmin
                .from('Restaurant')
                .update({ stripeAccountId: accountId })
                .eq('id', restaurantId);
        }

        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?stripe=refresh`,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?stripe=success`,
            type: 'account_onboarding',
        });

        return NextResponse.json({
            success: true,
            url: accountLink.url
        });

    } catch (error: any) {
        console.error('Stripe Connect error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create Stripe Connect link' },
            { status: 500 }
        );
    }
}

