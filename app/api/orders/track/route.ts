import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/orders/track?orderId=X - Get real-time order status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId is required' },
                { status: 400 }
            );
        }

        const { data: order, error } = await supabaseAdmin
            .from('Order')
            .select(`
                id,
                status,
                total,
                createdAt,
                tableNumber,
                customerName,
                OrderItem (
                    id,
                    quantity,
                    price,
                    notes,
                    Product (
                        name,
                        imageUrl
                    )
                )
            `)
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Calculate estimated time based on status
        const createdAt = new Date(order.createdAt);
        const now = new Date();
        const elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

        let estimatedMinutes = 0;
        let statusMessage = '';
        let progress = 0;

        switch (order.status) {
            case 'pending':
                estimatedMinutes = 20;
                statusMessage = 'Your order has been received';
                progress = 20;
                break;
            case 'preparing':
                estimatedMinutes = 15;
                statusMessage = 'Chef is preparing your order';
                progress = 50;
                break;
            case 'ready':
                estimatedMinutes = 0;
                statusMessage = 'Your order is ready!';
                progress = 90;
                break;
            case 'delivered':
                estimatedMinutes = 0;
                statusMessage = 'Order completed';
                progress = 100;
                break;
            case 'cancelled':
                estimatedMinutes = 0;
                statusMessage = 'Order was cancelled';
                progress = 0;
                break;
            default:
                estimatedMinutes = 20;
                statusMessage = 'Processing';
                progress = 10;
        }

        return NextResponse.json({
            order: {
                ...order,
                elapsedMinutes,
                estimatedMinutes,
                statusMessage,
                progress,
            }
        });

    } catch (error) {
        console.error('Order tracking error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
