'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { KitchenDisplay } from '../../components/KitchenDisplay';
import { useApp } from '../providers';

export default function Kitchen() {
  const router = useRouter();
  const { user, orders, updateOrderStatus } = useApp();

  // Allowed roles for kitchen access
  const allowedRoles = ['owner', 'manager', 'kitchen', 'waiter', 'admin'];

  // Redirect if not logged in or not authorized
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!allowedRoles.includes(user.role || '')) {
      router.push('/menu');
      return;
    }
  }, [user, router]);

  if (!user || !allowedRoles.includes(user.role || '')) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DC143C] border-t-transparent" />
      </div>
    );
  }

  return (
    <KitchenDisplay orders={orders} onUpdateStatus={updateOrderStatus} />
  );
}





