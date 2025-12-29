import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, password, firstName, lastName } = body;

        if (!token) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        // Verify and decode token
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        } catch (error) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        const { email, role, restaurantId } = decoded;

        // Find the invitation
        const { data: invitation } = await supabaseAdmin
            .from('RestaurantRole')
            .select('*')
            .eq('inviteToken', token)
            .eq('status', 'pending')
            .single();

        if (!invitation) {
            return NextResponse.json(
                { error: 'Invitation not found or already accepted' },
                { status: 404 }
            );
        }

        // Check if user already exists
        let userId: string;
        const { data: existingUser } = await supabaseAdmin
            .from('User')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            userId = existingUser.id;
        } else {
            // Create new user
            if (!password || !firstName || !lastName) {
                return NextResponse.json(
                    { error: 'Password, first name, and last name required for new users' },
                    { status: 400 }
                );
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const { data: newUser, error: userError } = await supabaseAdmin
                .from('User')
                .insert({
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName
                })
                .select()
                .single();

            if (userError || !newUser) {
                return NextResponse.json(
                    { error: 'Failed to create user account' },
                    { status: 500 }
                );
            }

            userId = newUser.id;
        }

        // Update invitation to accepted
        const { error: updateError } = await supabaseAdmin
            .from('RestaurantRole')
            .update({
                userId,
                status: 'accepted',
                acceptedAt: new Date().toISOString()
            })
            .eq('id', invitation.id);

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to accept invitation' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Invitation accepted successfully'
        });

    } catch (error) {
        console.error('Accept invitation error:', error);
        return NextResponse.json(
            { error: 'Failed to accept invitation' },
            { status: 500 }
        );
    }
}

