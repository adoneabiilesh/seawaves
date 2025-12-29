import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const VALID_STATUSES = ['pending', 'preparing', 'ready', 'served', 'cancelled'];

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, status, restaurantId } = body;

        if (!orderId || !status || !restaurantId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Get user's role
        const { data: userRole } = await supabaseAdmin
            .from('RestaurantRole')
            .select('role')
            .eq('userId', session.user.id)
            .eq('restaurantId', restaurantId)
            .eq('status', 'accepted')
            .single();

        if (!userRole) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Prepare update data
        const updateData: any = { status };

        // Add timestamps based on status
        if (status === 'preparing' && !updateData.prepStartedAt) {
            updateData.prepStartedAt = new Date().toISOString();
        } else if (status === 'ready' && !updateData.readyAt) {
            updateData.readyAt = new Date().toISOString();
        } else if (status === 'served' && !updateData.servedAt) {
            updateData.servedAt = new Date().toISOString();
        }

        // Update order status
        const { data: order, error } = await supabaseAdmin
            .from('Order')
            .update(updateData)
            .eq('id', orderId)
            .eq('restaurantId', restaurantId)
            .select()
            .single();

        if (error) {
            console.error('Order update error:', error);
            return NextResponse.json(
                { error: 'Failed to update order' },
                { status: 500 }
            );
        }

        // Create audit log
        await supabaseAdmin
            .from('AuditLog')
            .insert({
                restaurantId,
                userIdRef: session.user.id,
                action: 'order_status_updated',
                resourceType: 'order',
                resourceId: orderId,
                role: userRole.role,
                changes: { from: body.previousStatus, to: status }
            });

        // TODO: Emit Socket.io event for real-time update

        return NextResponse.json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Order status update error:', error);
        return NextResponse.json(
            { error: 'Failed to update order status' },
            { status: 500 }
        );
    }
}

