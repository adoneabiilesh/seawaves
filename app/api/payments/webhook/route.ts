import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentSuccess(paymentIntent);
                break;

            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object as Stripe.PaymentIntent;
                await handlePaymentFailure(failedPayment);
                break;

            case 'charge.refunded':
                const refund = event.data.object as Stripe.Charge;
                await handleRefund(refund);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const { orderId, restaurantId } = paymentIntent.metadata;

    // Update payment status
    await supabaseAdmin
        .from('Payment')
        .update({ status: 'completed' })
        .eq('stripePaymentId', paymentIntent.id);

    // Update order status to paid
    await supabaseAdmin
        .from('Order')
        .update({
            status: 'pending',
            paymentMode: 'online'
        })
        .eq('id', orderId);

    // Create audit log
    await supabaseAdmin
        .from('AuditLog')
        .insert({
            restaurantId,
            action: 'payment_completed',
            resourceType: 'payment',
            resourceId: paymentIntent.id,
            changes: { amount: paymentIntent.amount / 100 }
        });

    console.log(`Payment succeeded for order ${orderId}`);
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const { orderId } = paymentIntent.metadata;

    // Update payment status
    await supabaseAdmin
        .from('Payment')
        .update({ status: 'failed' })
        .eq('stripePaymentId', paymentIntent.id);

    console.log(`Payment failed for order ${orderId}`);
}

async function handleRefund(charge: Stripe.Charge) {
    const paymentIntentId = charge.payment_intent as string;

    // Update payment with refund info
    await supabaseAdmin
        .from('Payment')
        .update({
            status: 'refunded',
            refundAmount: charge.amount_refunded / 100
        })
        .eq('stripePaymentId', paymentIntentId);

    console.log(`Refund processed for payment ${paymentIntentId}`);
}

