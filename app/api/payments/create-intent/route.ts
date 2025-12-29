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
        const { orderId, amount, currency, restaurantId } = body;

        if (!orderId || !amount || !restaurantId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get restaurant's Stripe account
        const { data: restaurant } = await supabaseAdmin
            .from('Restaurant')
            .select('stripeAccountId, stripeConnected, commissionRate')
            .eq('id', restaurantId)
            .single();

        if (!restaurant?.stripeConnected || !restaurant.stripeAccountId) {
            return NextResponse.json(
                { error: 'Restaurant Stripe account not connected' },
                { status: 400 }
            );
        }

        // Calculate platform fee (default 3%)
        const commissionRate = restaurant.commissionRate || 0.03;
        const platformFee = Math.round(amount * commissionRate);
        const restaurantPayout = amount - platformFee;

        // Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency || 'eur',
            application_fee_amount: platformFee * 100,
            transfer_data: {
                destination: restaurant.stripeAccountId,
            },
            metadata: {
                orderId,
                restaurantId
            }
        });

        // Create payment record
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('Payment')
            .insert({
                restaurantId,
                orderId,
                stripePaymentId: paymentIntent.id,
                amount,
                currency: currency || 'eur',
                platformFee,
                restaurantPayout,
                paymentMethod: 'card',
                status: 'pending'
            })
            .select()
            .single();

        if (paymentError) {
            console.error('Payment record error:', paymentError);
            return NextResponse.json(
                { error: 'Failed to create payment record' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentId: payment.id
        });

    } catch (error: any) {
        console.error('Payment intent error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment intent' },
            { status: 500 }
        );
    }
}

