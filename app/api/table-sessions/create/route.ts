import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, tableNumber } = await request.json();

    if (!restaurantId || !tableNumber) {
      return NextResponse.json(
        { error: 'Restaurant ID and table number are required' },
        { status: 400 }
      );
    }

    // End any existing active session for this table
    await sql`
      UPDATE "TableSession"
      SET "isActive" = false, "endedAt" = NOW()
      WHERE "restaurantId" = ${restaurantId}
        AND "tableNumber" = ${tableNumber}
        AND "isActive" = true
    `;

    // Create new session
    const sessionToken = randomUUID();
    const sessionId = randomUUID();
    const now = new Date();

    const [session] = await sql`
      INSERT INTO "TableSession" (
        "id", "restaurantId", "tableNumber", "sessionToken", 
        "isActive", "startedAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${sessionId}, ${restaurantId}, ${tableNumber}, ${sessionToken},
        true, ${now}, ${now}, ${now}
      )
      RETURNING *
    `;

    return NextResponse.json({ session, sessionToken }, { status: 201 });
  } catch (error) {
    console.error('Error creating table session:', error);
    return NextResponse.json(
      { error: 'Failed to create table session' },
      { status: 500 }
    );
  }
}

