import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { sendTeamInvitationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, role, restaurantId, name } = body;

        if (!email || !role || !restaurantId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify user has owner role for this restaurant
        const { data: userRole } = await supabaseAdmin
            .from('RestaurantRole')
            .select('role')
            .eq('userId', session.user.id)
            .eq('restaurantId', restaurantId)
            .eq('status', 'accepted')
            .single();

        if (!userRole || userRole.role !== 'owner') {
            return NextResponse.json(
                { error: 'Only owners can invite team members' },
                { status: 403 }
            );
        }

        // Get restaurant name for email
        const { data: restaurant } = await supabaseAdmin
            .from('Restaurant')
            .select('name')
            .eq('id', restaurantId)
            .single();

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
            .from('User')
            .select('id')
            .eq('email', email)
            .single();

        // Generate invitation token
        const inviteToken = jwt.sign(
            { email, role, restaurantId, invitedBy: session.user.id, name },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: '7d' }
        );

        // Create restaurant role invitation
        const { data: invitation, error } = await supabaseAdmin
            .from('RestaurantRole')
            .insert({
                restaurantId,
                userId: existingUser?.id || null,
                role,
                status: 'pending',
                invitedBy: session.user.id,
                invitedEmail: email,
                inviteToken
            })
            .select()
            .single();

        if (error) {
            console.error('Invitation creation error:', error);
            return NextResponse.json(
                { error: 'Failed to create invitation' },
                { status: 500 }
            );
        }

        // Send invitation email
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite?token=${inviteToken}`;
        const emailSent = await sendTeamInvitationEmail(
            email,
            restaurant?.name || 'A Restaurant',
            role,
            inviteToken
        );

        return NextResponse.json({
            success: true,
            emailSent,
            invitation: {
                id: invitation.id,
                email,
                role,
                inviteUrl
            }
        });

    } catch (error) {
        console.error('Team invitation error:', error);
        return NextResponse.json(
            { error: 'Failed to send invitation' },
            { status: 500 }
        );
    }
}

