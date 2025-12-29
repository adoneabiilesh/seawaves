import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { menuItemId, orderId, rating } = await request.json();

    if (!menuItemId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Valid menu item ID and rating (1-5) are required' },
        { status: 400 }
      );
    }

    const ratingId = randomUUID();
    const now = new Date();

    const [ratingRecord] = await sql`
      INSERT INTO "Rating" (
        "id", "menuItemId", "orderId", "rating", "createdAt", "updatedAt"
      )
      VALUES (
        ${ratingId}, ${menuItemId}, ${orderId || null}, ${parseInt(rating)}, ${now}, ${now}
      )
      RETURNING *
    `;

    return NextResponse.json(ratingRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating rating:', error);
    return NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    );
  }
}


