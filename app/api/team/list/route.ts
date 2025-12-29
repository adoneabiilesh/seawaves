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

        // Verify user has access to this restaurant
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

        // Only owners can view team list
        if (userRole.role !== 'owner') {
            return NextResponse.json(
                { error: 'Only owners can view team members' },
                { status: 403 }
            );
        }

        // Get all team members for this restaurant
        const { data: teamMembers, error } = await supabaseAdmin
            .from('RestaurantRole')
            .select(`
        *,
        User (
          id,
          email,
          firstName,
          lastName
        )
      `)
            .eq('restaurantId', restaurantId)
            .in('status', ['accepted', 'pending']);

        if (error) {
            console.error('Team list error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch team members' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            teamMembers: teamMembers.map((member: any) => ({
                id: member.id,
                userId: member.userId,
                email: member.User?.email || member.invitedEmail,
                firstName: member.User?.firstName,
                lastName: member.User?.lastName,
                role: member.role,
                status: member.status,
                invitedAt: member.invitedAt,
                acceptedAt: member.acceptedAt
            }))
        });

    } catch (error) {
        console.error('Team list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch team members' },
            { status: 500 }
        );
    }
}

