import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Get menu items with their ratings
    const menuItems = await sql`
      SELECT 
        mi.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_ratings
      FROM "MenuItem" mi
      LEFT JOIN "Rating" r ON mi.id = r."menuItemId"
      WHERE mi."restaurantId" = ${restaurantId}
        AND mi.available = true
      GROUP BY mi.id
      HAVING COUNT(DISTINCT r.id) > 0
      ORDER BY avg_rating DESC, total_ratings DESC
      LIMIT ${limit}
    `;

    // Format results
    const mostLiked = menuItems.map((item: any) => ({
      ...item,
      avgRating: Math.round(parseFloat(item.avg_rating) * 10) / 10,
      totalRatings: parseInt(item.total_ratings) || 0,
    }));

    return NextResponse.json({ mostLiked });
  } catch (error) {
    console.error('Error fetching most liked items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch most liked items' },
      { status: 500 }
    );
  }
}


