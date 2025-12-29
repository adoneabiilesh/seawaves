/**
 * Image Upload API Route
 * POST /api/images/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { getImageStorageService } from '@/lib/imageStorage';
import { ImageType } from '@/lib/imageStorage/types';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Get file and metadata
        const file = formData.get('file') as File | null;
        const imageType = (formData.get('imageType') as ImageType) || 'product';
        const restaurantId = formData.get('restaurantId') as string;
        const altText = formData.get('altText') as string | null;
        const caption = formData.get('caption') as string | null;

        // Validation
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        // Upload image
        const service = getImageStorageService();
        const result = await service.upload({
            file,
            imageType,
            restaurantId,
            altText: altText || undefined,
            caption: caption || undefined,
            optimize: true,
            generateVariants: true,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Upload failed' },
                { status: 500 }
            );
        }

        // Return success with cache headers
        return NextResponse.json(result, {
            status: 200,
            headers: service.getCacheHeaders(),
        });
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
