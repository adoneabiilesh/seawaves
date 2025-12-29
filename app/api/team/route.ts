import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/team?restaurantId=X - Get all team members
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
                { error: 'restaurantId is required' },
                { status: 400 }
            );
        }

        // Verify user has access to this restaurant
        const { data: userRole } = await supabaseAdmin
            .from('RestaurantRole')
            .select('role')
            .eq('userId', session.user.id)
            .eq('restaurantId', restaurantId)
            .eq('status', 'accepted')
            .single();

        if (!userRole) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Fetch all roles for this restaurant with user details
        const { data: members, error } = await supabaseAdmin
            .from('RestaurantRole')
            .select(`
                id,
                role,
                status,
                invitedEmail,
                userId,
                User:userId (
                    firstName,
                    lastName,
                    email
                )
            `)
            .eq('restaurantId', restaurantId)
            .order('role', { ascending: true });

        if (error) {
            console.error('Error fetching team:', error);
            return NextResponse.json(
                { error: 'Failed to fetch team members' },
                { status: 500 }
            );
        }

        return NextResponse.json({ members });

    } catch (error) {
        console.error('Team fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
