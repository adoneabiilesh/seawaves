'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminPanel } from '../../components/AdminPanel';
import { useApp } from '../providers';

export default function Admin() {
  const router = useRouter();
  const { user, products, addProduct, updateProduct, tables, addTable, removeTable, settings, setSettings } = useApp();

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
    <AdminPanel 
      products={products} 
      onAddProduct={addProduct}
      onUpdateProduct={updateProduct}
      tables={tables}
      onAddTable={addTable}
      onRemoveTable={removeTable}
      settings={settings}
      onUpdateSettings={setSettings}
    />
  );
}





