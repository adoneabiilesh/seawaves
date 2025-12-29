'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageType } from '@/lib/imageStorage/types';

interface ImageUploaderProps {
    restaurantId: string;
    imageType?: ImageType;
    currentImageUrl?: string;
    onUploadComplete: (imageUrl: string, imageId: string) => void;
    onUploadError?: (error: string) => void;
    className?: string;
    aspectRatio?: 'square' | '16:9' | '4:3' | 'auto';
    maxSizeMB?: number;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    restaurantId,
    imageType = 'product',
    currentImageUrl,
    onUploadComplete,
    onUploadError,
    className,
    aspectRatio = 'square',
    maxSizeMB = 10,
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const aspectRatioClass = {
        square: 'aspect-square',
        '16:9': 'aspect-video',
        '4:3': 'aspect-[4/3]',
        auto: '',
    }[aspectRatio];

    const handleFileSelect = useCallback(async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            onUploadError?.('Invalid file type');
            return;
        }

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File size must be less than ${maxSizeMB}MB`);
            onUploadError?.(`File too large`);
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        await uploadFile(file);
    }, [maxSizeMB, onUploadError]);

    const uploadFile = async (file: File) => {
        setUploadStatus('uploading');
        setProgress(0);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('imageType', imageType);
            formData.append('restaurantId', restaurantId);

            // Simulate progress (actual progress would need XHR)
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 100);

            const response = await fetch('/api/images/upload', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await response.json();

            if (data.success && data.image) {
                setUploadStatus('success');
                setPreviewUrl(data.image.originalUrl);
                onUploadComplete(data.image.originalUrl, data.image.id);
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (err) {
            setUploadStatus('error');
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            setError(errorMessage);
            onUploadError?.(errorMessage);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        setUploadStatus('idle');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={cn('relative', className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
            />

            {/* Upload Zone */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200',
                    aspectRatioClass,
                    isDragOver
                        ? 'border-primary bg-primary/10'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
                    previewUrl && 'border-solid border-muted',
                    className
                )}
                style={{ minHeight: aspectRatio === 'auto' ? '150px' : undefined }}
            >
                {/* Preview Image */}
                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    />
                )}

                {/* Overlay Content */}
                <div
                    className={cn(
                        'absolute inset-0 flex flex-col items-center justify-center rounded-lg',
                        previewUrl ? 'bg-black/50 opacity-0 hover:opacity-100 transition-opacity' : ''
                    )}
                >
                    {uploadStatus === 'uploading' ? (
                        <div className="flex flex-col items-center gap-2 text-white">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-sm font-medium">{progress}%</span>
                        </div>
                    ) : uploadStatus === 'success' ? (
                        <div className="flex flex-col items-center gap-2 text-white">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                            <span className="text-sm font-medium">Uploaded!</span>
                        </div>
                    ) : uploadStatus === 'error' ? (
                        <div className="flex flex-col items-center gap-2 text-white">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                            <span className="text-sm font-medium">Failed</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            {previewUrl ? (
                                <ImageIcon className="w-8 h-8 text-white" />
                            ) : (
                                <>
                                    <Upload className="w-8 h-8" />
                                    <span className="text-sm font-medium">
                                        Drop image here or click to upload
                                    </span>
                                    <span className="text-xs text-muted-foreground/70">
                                        JPEG, PNG, WebP up to {maxSizeMB}MB
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                {previewUrl && uploadStatus !== 'uploading' && (
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full shadow-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-2 text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </p>
            )}
        </div>
    );
};

export default ImageUploader;
