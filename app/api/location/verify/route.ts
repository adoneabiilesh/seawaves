import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, latitude, longitude } = await request.json();

    if (!restaurantId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Restaurant ID and coordinates are required' },
        { status: 400 }
      );
    }

    const [restaurant] = await sql`
      SELECT "id", "latitude", "longitude", "locationRadius"
      FROM "Restaurant"
      WHERE "id" = ${restaurantId}
    `;

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // If restaurant doesn't have location set, allow access (backward compatibility)
    if (!restaurant.latitude || !restaurant.longitude) {
      return NextResponse.json({ allowed: true, reason: 'Location not configured' });
    }

    const distance = calculateDistance(
      restaurant.latitude,
      restaurant.longitude,
      latitude,
      longitude
    );

    const radius = restaurant.locationRadius || 0.05; // Default 50 meters
    const allowed = distance <= radius;

    return NextResponse.json({
      allowed,
      distance: distance * 1000, // Convert to meters
      radius: radius * 1000, // Convert to meters
      message: allowed
        ? 'Access granted'
        : `You are ${(distance * 1000 - radius * 1000).toFixed(0)}m outside the allowed range`,
    });
  } catch (error) {
    console.error('Error verifying location:', error);
    return NextResponse.json(
      { error: 'Failed to verify location' },
      { status: 500 }
    );
  }
}

