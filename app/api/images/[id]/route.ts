/**
 * Image Retrieval/Delete API Route
 * GET /api/images/[id] - Get image metadata
 * DELETE /api/images/[id] - Delete image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getImageStorageService } from '@/lib/imageStorage';

interface RouteParams {
    params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = params;
        const service = getImageStorageService();

        const image = await service.getImage(id);

        if (!image) {
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        // Get query params for optimization
        const searchParams = request.nextUrl.searchParams;
        const width = searchParams.get('width') ? parseInt(searchParams.get('width')!) : undefined;
        const height = searchParams.get('height') ? parseInt(searchParams.get('height')!) : undefined;
        const format = searchParams.get('format') as 'webp' | 'avif' | 'jpg' | 'png' | undefined;
        const quality = searchParams.get('quality') ? parseInt(searchParams.get('quality')!) : undefined;

        // Get optimized URL if options provided
        let url = image.originalUrl;
        if (width || height || format || quality) {
            url = service.getOptimizedUrl(id, image, { width, height, format, quality });
        }

        // Return metadata with optimized URL
        return NextResponse.json(
            {
                ...image,
                optimizedUrl: url,
            },
            {
                status: 200,
                headers: service.getCacheHeaders(),
            }
        );
    } catch (error) {
        console.error('Get image error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = params;
        const service = getImageStorageService();

        const deleted = await service.deleteImage(id);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Image not found or already deleted' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Image deleted' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete image error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
