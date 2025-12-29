'use client';

import React from 'react';

// Generic Loading Skeleton (used by admin page)
export const LoadingSkeleton = () => (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DC143C] border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading...</p>
        </div>
    </div>
);

// Menu Page Skeleton
export const MenuPageSkeleton = () => (
    <div className="min-h-screen bg-[#FAF8F5]">
        {/* Header Skeleton */}
        <div className="bg-white border-b-4 border-black p-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
        </div>

        {/* Categories Skeleton */}
        <div className="sticky top-0 bg-[#FAF8F5] py-4 px-4">
            <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                ))}
            </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        </div>
    </div>
);

// Product Card Skeleton
export const ProductCardSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-200" />
        <div className="p-5 space-y-3">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="flex gap-2 mt-4">
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
            <div className="h-10 w-full bg-gray-200 rounded-xl mt-4" />
        </div>
    </div>
);

// Order Card Skeleton
export const OrderCardSkeleton = () => (
    <div className="bg-white rounded-2xl border-2 border-black p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <div className="h-5 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
    </div>
);

// Table Card Skeleton
export const TableCardSkeleton = () => (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4 animate-pulse">
        <div className="flex justify-between mb-2">
            <div className="h-5 w-12 bg-gray-200 rounded-full" />
            <div className="h-4 w-10 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-12 bg-gray-200 rounded mx-auto my-2" />
        <div className="h-8 w-full bg-gray-200 rounded-lg mt-2" />
    </div>
);

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-6 w-6 bg-gray-200 rounded" />
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
        ))}
    </div>
);

// Cart Drawer Skeleton
export const CartDrawerSkeleton = () => (
    <div className="p-4 space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-12 bg-gray-200 rounded" />
            </div>
        ))}
        <div className="border-t pt-4 mt-4">
            <div className="flex justify-between mb-4">
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="h-6 w-20 bg-gray-200 rounded" />
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-xl" />
        </div>
    </div>
);

// Generic List Skeleton
export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
    <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-16 w-full bg-gray-200 rounded-lg animate-pulse" />
        ))}
    </div>
);
