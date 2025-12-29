import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID required' },
                { status: 400 }
            );
        }

        // Get user's role for this restaurant
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

        let query = supabaseAdmin
            .from('Order')
            .select(`
        *,
        OrderItem (*)
      `)
            .eq('restaurantId', restaurantId);

        // Apply role-based filtering
        switch (userRole.role) {
            case 'waiter':
                // Waiters only see active orders (not completed/cancelled)
                query = query.in('status', ['pending', 'preparing', 'ready']);
                break;

            case 'kitchen':
                // Kitchen only sees pending and preparing orders
                query = query.in('status', ['pending', 'preparing']);
                break;

            case 'manager':
            case 'owner':
                // Managers and owners see all orders
                break;
        }

        query = query.order('createdAt', { ascending: false }).limit(100);

        const { data: orders, error } = await query;

        if (error) {
            console.error('Orders fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch orders' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            orders,
            userRole: userRole.role
        });

    } catch (error) {
        console.error('Orders list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

