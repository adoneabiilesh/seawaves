import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/sessions/validate - Validate a session token
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tableNumber, sessionToken, restaurantId } = body;

        if (!tableNumber || !sessionToken) {
            return NextResponse.json(
                { valid: false, error: 'tableNumber and sessionToken are required' },
                { status: 400 }
            );
        }

        // Find the session
        let query = supabaseAdmin
            .from('TableSession')
            .select('*')
            .eq('tableNumber', tableNumber)
            .eq('sessionToken', sessionToken)
            .eq('sessionStatus', 'active');

        if (restaurantId) {
            query = query.eq('restaurantId', restaurantId);
        }

        const { data: session, error } = await query.maybeSingle();

        if (error) {
            console.error('Session validation error:', error);
            return NextResponse.json(
                { valid: false, error: 'Failed to validate session' },
                { status: 500 }
            );
        }

        if (!session) {
            return NextResponse.json({
                valid: false,
                error: 'Invalid or expired session. Please ask staff to open your table.'
            });
        }

        // Check if session is expired (older than 8 hours)
        const startedAt = new Date(session.startedAt);
        const now = new Date();
        const hoursElapsed = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);

        if (hoursElapsed > 8) {
            // Auto-expire the session
            await supabaseAdmin
                .from('TableSession')
                .update({ sessionStatus: 'expired', closedAt: new Date().toISOString() })
                .eq('id', session.id);

            return NextResponse.json({
                valid: false,
                error: 'Session has expired. Please ask staff to open a new session.'
            });
        }

        return NextResponse.json({
            valid: true,
            session: {
                id: session.id,
                tableNumber: session.tableNumber,
                totalAmount: session.totalAmount,
                guestCount: session.guestCount,
                startedAt: session.startedAt
            }
        });

    } catch (error) {
        console.error('Session validate error:', error);
        return NextResponse.json(
            { valid: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/sessions/validate?table=X - Lookup active session by table number (session token optional)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tableNumber = searchParams.get('table');
        const sessionToken = searchParams.get('session'); // Optional now
        const restaurantId = searchParams.get('restaurantId');

        if (!tableNumber) {
            return NextResponse.json(
                { valid: false, error: 'table param is required' },
                { status: 400 }
            );
        }

        // Build query - lookup by table number, optionally filter by session token
        let query = supabaseAdmin
            .from('TableSession')
            .select(`
                *,
                Order (
                    id,
                    total,
                    status,
                    createdAt
                )
            `)
            .eq('tableNumber', parseInt(tableNumber))
            .eq('sessionStatus', 'active');

        // If session token provided, validate it specifically
        if (sessionToken) {
            query = query.eq('sessionToken', sessionToken);
        }

        if (restaurantId) {
            query = query.eq('restaurantId', restaurantId);
        }

        const { data: session, error } = await query.maybeSingle();

        if (error) {
            console.error('Session lookup error:', error);
            return NextResponse.json({
                valid: false,
                error: 'Failed to lookup session'
            });
        }

        if (!session) {
            return NextResponse.json({
                valid: false,
                error: 'No active session for this table. Please ask staff to open your table.'
            });
        }

        // Check if session is expired (older than 8 hours)
        const startedAt = new Date(session.startedAt);
        const now = new Date();
        const hoursElapsed = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);

        if (hoursElapsed > 8) {
            // Auto-expire the session
            await supabaseAdmin
                .from('TableSession')
                .update({ sessionStatus: 'expired', closedAt: new Date().toISOString() })
                .eq('id', session.id);

            return NextResponse.json({
                valid: false,
                error: 'Session has expired. Please ask staff to open a new session.'
            });
        }

        return NextResponse.json({
            valid: true,
            session
        });

    } catch (error) {
        console.error('Session validate GET error:', error);
        return NextResponse.json(
            { valid: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
