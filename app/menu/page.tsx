'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MenuPage } from '../../components/MenuPage';
import { LocationGuard } from '../../components/LocationGuard';
import { useApp } from '../providers';

export default function Menu() {
  const router = useRouter();
  const { user, products, addToCart, language, setLanguage, restaurantId } = useApp();

  // Redirect if not logged in as customer
  React.useEffect(() => {
    if (!user) {
      router.push('/login?role=customer');
      return;
    }
    if (user.role !== 'customer') {
      router.push(user.role === 'admin' ? '/admin' : '/');
      return;
    }
  }, [user, router]);

  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <LocationGuard restaurantId={restaurantId}>
      <MenuPage 
        products={products.filter(p => p.available)} 
        onAddToCart={addToCart} 
        currentLang={language} 
        onSetLang={setLanguage}
        restaurantId={restaurantId}
      />
    </LocationGuard>
  );
}





