'use client';

import React from 'react';
import { Navigation } from './Navigation';
import { CartDrawer } from './CartDrawer';
import { ReviewModal } from './ReviewModal';
import { useApp } from '../app/providers';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateCartQuantity, 
    handleCheckout, 
    settings,
    showReviewModal,
    setShowReviewModal,
    lastOrderId,
    orders,
    restaurantId
  } = useApp();

  return (
    <>
      <Navigation />
      {children}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        onCheckout={handleCheckout}
        settings={settings}
      />
      {lastOrderId && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
          }}
          orderId={lastOrderId}
          restaurantId={restaurantId}
          items={orders.find(o => o.id === lastOrderId)?.items || []}
          onReviewSubmitted={() => {
            console.log('Review submitted successfully');
          }}
        />
      )}
    </>
  );
}





