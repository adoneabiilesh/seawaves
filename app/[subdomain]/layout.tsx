'use client';

import React from 'react';
import { Navigation } from '@/components/Navigation';

export default function TenantLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { subdomain: string };
}) {
    return (
        <div className="min-h-screen bg-[#FFFFF0]">
            {/* We can potentially pass subdomain to Nav if needed */}
            {children}
        </div>
    );
}
