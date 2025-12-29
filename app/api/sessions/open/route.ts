import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Generate a random session token
function generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// POST /api/sessions/open - Open a new table session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { restaurantId, tableNumber, guestCount = 1 } = body;

        if (!restaurantId || !tableNumber) {
            return NextResponse.json(
                { error: 'restaurantId and tableNumber are required' },
                { status: 400 }
            );
        }

        // Check if there's already an active session for this table
        const { data: existingSession } = await supabaseAdmin
            .from('TableSession')
            .select('*')
            .eq('restaurantId', restaurantId)
            .eq('tableNumber', tableNumber)
            .eq('sessionStatus', 'active')
            .maybeSingle();

        if (existingSession) {
            return NextResponse.json(
                { error: 'Table already has an active session', session: existingSession },
                { status: 409 }
            );
        }

        // Generate unique session token
        const sessionToken = generateToken(32);

        // Create new session
        const { data: session, error } = await supabaseAdmin
            .from('TableSession')
            .insert({
                restaurantId,
                tableNumber,
                sessionToken,
                guestCount,
                sessionStatus: 'active',
                totalAmount: 0,
                paidAmount: 0
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating session:', error);
            return NextResponse.json(
                { error: 'Failed to create session' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            session,
            // Generate QR URL for this session
            qrUrl: `/dine-in?table=${tableNumber}&session=${sessionToken}`
        });

    } catch (error) {
        console.error('Session open error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/sessions/open?restaurantId=X - Get all active sessions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'restaurantId is required' },
                { status: 400 }
            );
        }

        // Fetch sessions without nested Order join (FK may not be in schema cache)
        const { data: sessions, error } = await supabaseAdmin
            .from('TableSession')
            .select('*')
            .eq('restaurantId', restaurantId)
            .eq('sessionStatus', 'active')
            .order('tableNumber', { ascending: true });

        if (error) {
            console.error('Error fetching sessions:', error);
            return NextResponse.json(
                { error: 'Failed to fetch sessions' },
                { status: 500 }
            );
        }

        // Optionally fetch orders for each session separately
        const sessionsWithOrders = await Promise.all(
            (sessions || []).map(async (session: any) => {
                const { data: orders } = await supabaseAdmin
                    .from('Order')
                    .select('id, total, status, createdAt')
                    .eq('tableSessionId', session.id);

                return { ...session, orders: orders || [] };
            })
        );

        return NextResponse.json({ sessions: sessionsWithOrders });

    } catch (error) {
        console.error('Session fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
