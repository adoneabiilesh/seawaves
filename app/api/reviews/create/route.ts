import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, orderId, rating, comment, customerName } = await request.json();

    if (!restaurantId || !orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Restaurant ID, order ID, and valid rating (1-5) are required' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const [existingReview] = await sql`
      SELECT * FROM "Review"
      WHERE "orderId" = ${orderId}
    `;

    if (existingReview) {
      // Update existing review
      const now = new Date();
      const [review] = await sql`
        UPDATE "Review"
        SET 
          "rating" = ${parseInt(rating)},
          "comment" = ${comment || null},
          "customerName" = ${customerName || null},
          "updatedAt" = ${now}
        WHERE "orderId" = ${orderId}
        RETURNING *
      `;
      return NextResponse.json(review);
    }

    // Create new review
    const reviewId = randomUUID();
    const now = new Date();
    const [review] = await sql`
      INSERT INTO "Review" (
        "id", "restaurantId", "orderId", "rating", "comment", "customerName", "createdAt", "updatedAt"
      )
      VALUES (
        ${reviewId}, ${restaurantId}, ${orderId}, ${parseInt(rating)}, 
        ${comment || null}, ${customerName || null}, ${now}, ${now}
      )
      RETURNING *
    `;

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}


