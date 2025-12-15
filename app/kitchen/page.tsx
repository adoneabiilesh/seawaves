'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { KitchenDisplay } from '../../components/KitchenDisplay';
import { useApp } from '../providers';

export default function Kitchen() {
  const router = useRouter();
  const { user, orders, updateOrderStatus } = useApp();

  // Redirect if not logged in as admin
  React.useEffect(() => {
    if (!user) {
      router.push('/login?role=admin');
      return;
    }
    if (user.role !== 'admin') {
      router.push(user.role === 'customer' ? '/menu' : '/');
      return;
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <KitchenDisplay orders={orders} onUpdateStatus={updateOrderStatus} />
  );
}





