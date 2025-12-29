/**
 * Google Photos API Provider
 * Backup provider for user photos
 */

import {
    StorageProviderInterface,
    ImageUploadResult,
    ImageVariants,
    GooglePhotosConfig,
} from '../types';

export class GooglePhotosProvider implements StorageProviderInterface {
    name: 'google_photos' = 'google_photos';
    private config: GooglePhotosConfig;
    private accessToken: string | null = null;

    constructor(config?: GooglePhotosConfig) {
        this.config = config || {
            clientId: process.env.GOOGLE_PHOTOS_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_PHOTOS_CLIENT_SECRET || '',
            refreshToken: process.env.GOOGLE_PHOTOS_REFRESH_TOKEN || '',
        };
    }

    private async getAccessToken(): Promise<string> {
        if (this.accessToken) return this.accessToken;

        if (!this.config.refreshToken) {
            throw new Error('Google Photos refresh token not configured');
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    refresh_token: this.config.refreshToken,
                    grant_type: 'refresh_token',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh Google access token');
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            return this.accessToken!;
        } catch (error) {
            console.error('Google Photos token refresh error:', error);
            throw error;
        }
    }

    async upload(
        file: Buffer | Blob,
        fileName: string,
        options?: {
            folder?: string;
            optimize?: boolean;
            generateVariants?: boolean;
        }
    ): Promise<ImageUploadResult> {
        const accessToken = await this.getAccessToken();
        const blob = file instanceof Blob ? file : new Blob([file]);

        try {
            // Step 1: Get upload token
            const uploadResponse = await fetch(
                'https://photoslibrary.googleapis.com/v1/uploads',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/octet-stream',
                        'X-Goog-Upload-File-Name': fileName,
                        'X-Goog-Upload-Protocol': 'raw',
                    },
                    body: blob,
                }
            );

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload to Google Photos');
            }

            const uploadToken = await uploadResponse.text();

            // Step 2: Create media item
            const createResponse = await fetch(
                'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        newMediaItems: [
                            {
                                description: options?.folder || 'Restaurant image',
                                simpleMediaItem: {
                                    fileName,
                                    uploadToken,
                                },
                            },
                        ],
                    }),
                }
            );

            if (!createResponse.ok) {
                throw new Error('Failed to create Google Photos media item');
            }

            const createData = await createResponse.json();
            const mediaItem = createData.newMediaItemResults?.[0]?.mediaItem;

            if (!mediaItem) {
                throw new Error('No media item returned from Google Photos');
            }

            const baseUrl = mediaItem.baseUrl;

            // Google Photos URLs need size parameters for optimization
            const variants: ImageVariants = {
                original: `${baseUrl}=w2048-h2048`,
                thumbnail: `${baseUrl}=w150-h150-c`,
                small: `${baseUrl}=w300-h300-c`,
                medium: `${baseUrl}=w600-h600-c`,
                large: `${baseUrl}=w1200-h1200-c`,
            };

            return {
                url: `${baseUrl}=w1200-h1200`,
                providerId: mediaItem.id,
                variants,
                width: mediaItem.mediaMetadata?.width,
                height: mediaItem.mediaMetadata?.height,
            };
        } catch (error) {
            console.error('Google Photos upload error:', error);
            throw error;
        }
    }

    async delete(providerId: string): Promise<boolean> {
        // Google Photos API doesn't support deletion via API
        // Items can only be moved to trash manually
        console.warn('Google Photos does not support programmatic deletion');
        return false;
    }

    getOptimizedUrl(
        url: string,
        options?: {
            width?: number;
            height?: number;
            quality?: number;
            format?: 'webp' | 'avif' | 'jpg' | 'png';
        }
    ): string {
        if (!url) return url;

        // Remove existing parameters
        const baseUrl = url.split('=')[0];

        const params: string[] = [];
        if (options?.width) params.push(`w${options.width}`);
        if (options?.height) params.push(`h${options.height}`);
        params.push('c'); // Crop to fit

        return `${baseUrl}=${params.join('-')}`;
    }

    async isAvailable(): Promise<boolean> {
        if (!this.config.clientId || !this.config.refreshToken) return false;

        try {
            await this.getAccessToken();
            return true;
        } catch {
            return false;
        }
    }
}

// Singleton instance
let googlePhotosInstance: GooglePhotosProvider | null = null;

export function getGooglePhotosProvider(config?: GooglePhotosConfig): GooglePhotosProvider {
    if (!googlePhotosInstance || config) {
        googlePhotosInstance = new GooglePhotosProvider(config);
    }
    return googlePhotosInstance;
}
