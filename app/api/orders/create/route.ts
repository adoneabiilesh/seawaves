import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { restaurantId, items, customerName, customerEmail, tableNumber, paymentMode, specialRequests } = body;

        if (!restaurantId || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Calculate total
        const totalPrice = items.reduce((sum: number, item: any) =>
            sum + (item.price * item.quantity), 0
        );

        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Create order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('Order')
            .insert({
                restaurantId,
                customerName: customerName || 'Guest',
                customerEmail,
                tableNumber,
                totalPrice,
                paymentMode: paymentMode || 'online',
                status: paymentMode === 'counter' ? 'pending_payment' : 'pending',
                specialRequests,
                orderNumber
            })
            .select()
            .single();

        if (orderError || !order) {
            console.error('Order creation error:', orderError);
            return NextResponse.json(
                { error: 'Failed to create order' },
                { status: 500 }
            );
        }

        // Create order items
        const orderItems = items.map((item: any) => ({
            orderId: order.id,
            menuItemId: item.id,
            menuItemName: item.name?.en || item.name,
            quantity: item.quantity,
            price: item.price,
            modifications: item.modifiers?.join(', '),
            specialRequests: item.specialRequest
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('OrderItem')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items error:', itemsError);
            // Rollback order
            await supabaseAdmin.from('Order').delete().eq('id', order.id);
            return NextResponse.json(
                { error: 'Failed to create order items' },
                { status: 500 }
            );
        }

        // TODO: Emit Socket.io event for real-time update

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                totalPrice: order.totalPrice,
                status: order.status,
                estimatedPrepTime: order.estimatedPrepTime
            }
        });

    } catch (error) {
        console.error('Order creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}

