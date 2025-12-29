/**
 * Firebase Storage Provider
 * Priority 2: Profile and backup images
 */

import {
    StorageProviderInterface,
    ImageUploadResult,
    ImageVariants,
    FirebaseConfig,
} from '../types';

export class FirebaseProvider implements StorageProviderInterface {
    name: 'firebase' = 'firebase';
    private config: FirebaseConfig;
    private initialized = false;

    constructor(config?: FirebaseConfig) {
        this.config = config || {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        };
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
        const folder = options?.folder || 'images';
        const timestamp = Date.now();
        const uniqueFileName = `${folder}/${timestamp}-${fileName}`;

        // Convert to base64 for REST API upload
        const blob = file instanceof Blob ? file : new Blob([file]);
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const url = `https://firebasestorage.googleapis.com/v0/b/${this.config.storageBucket}/o?name=${encodeURIComponent(uniqueFileName)}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': blob.type || 'image/jpeg',
                },
                body: blob,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Firebase upload failed: ${error}`);
            }

            const data = await response.json();

            // Construct download URL
            const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${this.config.storageBucket}/o/${encodeURIComponent(data.name)}?alt=media`;

            // Firebase doesn't auto-generate variants, so we provide the same URL
            // In production, you'd use Firebase Extensions or Cloud Functions for resizing
            const variants: ImageVariants = {
                original: downloadUrl,
                thumbnail: downloadUrl,
                small: downloadUrl,
                medium: downloadUrl,
                large: downloadUrl,
            };

            return {
                url: downloadUrl,
                providerId: data.name,
                variants,
            };
        } catch (error) {
            console.error('Firebase upload error:', error);
            throw error;
        }
    }

    async delete(providerId: string): Promise<boolean> {
        try {
            const url = `https://firebasestorage.googleapis.com/v0/b/${this.config.storageBucket}/o/${encodeURIComponent(providerId)}`;

            const response = await fetch(url, {
                method: 'DELETE',
            });

            return response.ok;
        } catch (error) {
            console.error('Firebase delete error:', error);
            return false;
        }
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
        // Firebase Storage doesn't have built-in transformations
        // Return original URL; use Cloud Functions for transformations in production
        return url;
    }

    async isAvailable(): Promise<boolean> {
        if (!this.config.storageBucket) return false;

        try {
            const response = await fetch(
                `https://firebasestorage.googleapis.com/v0/b/${this.config.storageBucket}/o`,
                { method: 'GET' }
            );
            return response.ok || response.status === 401; // 401 means it exists but needs auth
        } catch {
            return false;
        }
    }
}

// Singleton instance
let firebaseInstance: FirebaseProvider | null = null;

export function getFirebaseProvider(config?: FirebaseConfig): FirebaseProvider {
    if (!firebaseInstance || config) {
        firebaseInstance = new FirebaseProvider(config);
    }
    return firebaseInstance;
}
