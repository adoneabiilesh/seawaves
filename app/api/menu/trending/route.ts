import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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
    // Note: OrderItem doesn't have menuItemId, so we'll calculate trending based on ratings only
    // For order counts, we'll use a subquery that matches by name
    const menuItems = await sql`
      SELECT 
        mi.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_ratings,
        COALESCE((
          SELECT SUM(oi.quantity)
          FROM "OrderItem" oi
          INNER JOIN "Order" o ON oi."orderId" = o.id
          WHERE (mi.name->>'en')::text = oi."menuItemName"
            AND o."restaurantId" = ${restaurantId}
            AND o."createdAt" >= NOW() - INTERVAL '30 days'
        ), 0) as recent_orders
      FROM "MenuItem" mi
      LEFT JOIN "Rating" r ON mi.id = r."menuItemId"
      WHERE mi."restaurantId" = ${restaurantId}
        AND mi.available = true
      GROUP BY mi.id
    `;

    // Calculate trending score for each item
    const itemsWithScore = menuItems.map((item: any) => {
      const avgRating = parseFloat(item.avg_rating) || 0;
      const recentOrders = parseInt(item.recent_orders) || 0;

      // Trending score: (average rating * 0.6) + (normalized recent orders * 0.4)
      const normalizedOrders = Math.min(recentOrders / 100, 1);
      const trendingScore = avgRating * 0.6 + normalizedOrders * 4;

      return {
        ...item,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings: parseInt(item.total_ratings) || 0,
        recentOrders,
        trendingScore,
      };
    });

    // Sort by trending score and return top items
    const trending = itemsWithScore
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);

    return NextResponse.json({ trending });
  } catch (error) {
    console.error('Error fetching trending items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending items' },
      { status: 500 }
    );
  }
}
