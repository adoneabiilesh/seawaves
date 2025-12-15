'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, MonitorPlay, ShoppingCart, ArrowLeft, LogOut } from 'lucide-react';
import { useApp } from '../app/providers';

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, cart, isCartOpen, setIsCartOpen } = useApp();

  if (pathname === '/' || pathname?.startsWith('/login')) return null;

  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

  if (pathname === '/kitchen') {
    return (
      <nav className="bg-[#FFFFFE] border-b border-[#111111] px-6 py-4 flex justify-between items-center">
        <Link href="/admin" className="font-bold flex items-center gap-2 text-[#111111] hover:underline transition-colors">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#111111] animate-pulse"></div>
          <span className="font-mono text-[#111111] font-bold tracking-wider">LIVE KITCHEN FEED</span>
        </div>
      </nav>
    );
  }

  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="sticky top-0 z-40 bg-[#FFFFFE] border-b border-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#111111] text-[#FFFFFE] border border-[#111111]">
                {isCustomer ? <UtensilsCrossed size={20} /> : <MonitorPlay size={20} />}
              </div>
              <Link href={isAdmin ? '/admin' : '/menu'} className="font-bold text-xl tracking-tight text-[#111111]">
                Culinary<span className="text-[#111111]">AI</span>
                {isAdmin && <span className="ml-2 text-[10px] bg-[#111111] text-[#FFFFFE] px-2 py-1 rounded-full uppercase tracking-wider font-bold border border-[#111111]">Admin</span>}
              </Link>
            </div>
            {isAdmin && (
              <div className="hidden md:flex space-x-1 ml-4">
                <Link href="/admin" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border border-[#111111] ${pathname === '/admin' ? 'bg-[#111111] text-[#FFFFFE]' : 'bg-[#FFFFFE] text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFE]'}`}>
                  Dashboard
                </Link>
                <Link href="/kitchen" className="px-4 py-2 rounded-md text-sm font-medium transition-colors border border-[#111111] bg-[#FFFFFE] text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFE] flex items-center gap-1">
                  Open KDS
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-sm font-bold text-[#111111]">{user.name}</span>
                  {isCustomer && <span className="text-xs text-[#111111] font-medium bg-[#FFFFFE] border border-[#111111] px-2 rounded-full">Table {user.tableNumber}</span>}
                </div>
                
                {isCustomer && (
                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2.5 rounded-md hover:bg-[#111111] hover:text-[#FFFFFE] transition-colors text-[#111111] border border-[#111111] group"
                  >
                    <ShoppingCart size={22} />
                    {cartCount > 0 && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#111111] rounded-full border-2 border-[#FFFFFE] animate-bounce"></span>
                    )}
                  </button>
                )}

                <button 
                  onClick={logout}
                  className="p-2 text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFE] transition-colors rounded-md border border-[#111111]"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

