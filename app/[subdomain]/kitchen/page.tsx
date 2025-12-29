'use client';

import React from 'react';
import { KitchenDisplay } from '@/components/KitchenDisplay';
import { useApp } from '@/app/providers';
import { OrderStatus } from '@/types';

export default function TenantKitchenPage() {
    const { orders, setOrders } = useApp();

    const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    };

    return <KitchenDisplay orders={orders} onUpdateStatus={handleUpdateStatus} />;
}
