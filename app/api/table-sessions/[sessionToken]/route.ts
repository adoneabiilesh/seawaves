import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionToken: string } }
) {
  try {
    const [session] = await sql`
      SELECT * FROM "TableSession"
      WHERE "sessionToken" = ${params.sessionToken}
    `;

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get orders for this session
    const orders = await sql`
      SELECT * FROM "Order"
      WHERE "tableSessionId" = ${session.id}
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json({ ...session, orders });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionToken: string } }
) {
  try {
    const { isActive } = await request.json();

    const updateData: any = {
      isActive: isActive ?? false,
      updatedAt: new Date(),
    };

    if (isActive === false) {
      updateData.endedAt = new Date();
    }

    const [session] = await sql`
      UPDATE "TableSession"
      SET 
        "isActive" = ${updateData.isActive},
        "endedAt" = ${updateData.endedAt || null},
        "updatedAt" = ${updateData.updatedAt}
      WHERE "sessionToken" = ${params.sessionToken}
      RETURNING *
    `;

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

