import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/sessions/close - Close a table session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId, paidAmount } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 }
            );
        }

        // Get the session
        const { data: session, error: fetchError } = await supabaseAdmin
            .from('TableSession')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (fetchError || !session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        if (session.sessionStatus !== 'active') {
            return NextResponse.json(
                { error: 'Session is not active' },
                { status: 400 }
            );
        }

        // Close the session
        const { data: closedSession, error: updateError } = await supabaseAdmin
            .from('TableSession')
            .update({
                sessionStatus: 'closed',
                closedAt: new Date().toISOString(),
                paidAmount: paidAmount || session.totalAmount,
                updatedAt: new Date().toISOString()
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (updateError) {
            console.error('Error closing session:', updateError);
            return NextResponse.json(
                { error: 'Failed to close session' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            session: closedSession,
            message: `Table ${closedSession.tableNumber} session closed. Total: $${closedSession.totalAmount.toFixed(2)}`
        });

    } catch (error) {
        console.error('Session close error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
