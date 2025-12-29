'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, MonitorPlay, ShoppingCart, ArrowLeft, LogOut, Menu, X } from 'lucide-react';
import { useApp } from '../app/providers';

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, cart, setIsCartOpen, tenant } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide on main landing page and login
  if ((pathname === '/' && !tenant) || pathname?.startsWith('/login')) return null;

  const cartCount = (cart || []).reduce((a, b) => a + b.quantity, 0);

  if (pathname === '/kitchen') {
    return (
      <nav className="bg-[#FFFFFE] border-b border-[#111111] px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link href="/admin" className="font-bold flex items-center gap-2 text-[#111111] hover:underline transition-colors text-sm sm:text-base">
          <ArrowLeft size={18} /> <span className="hidden sm:inline">Back to Dashboard</span><span className="sm:hidden">Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#111111] animate-pulse"></div>
          <span className="font-mono text-[#111111] font-bold tracking-wider text-xs sm:text-sm">LIVE KITCHEN</span>
        </div>
      </nav>
    );
  }

  const isStaff = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'waiter' || user?.role === 'kitchen';

  return (
    <nav className="sticky top-0 z-50 bg-[#FFFFF0] border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(220,20,60,1)] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] transition-transform">
                <UtensilsCrossed size={20} />
              </div>
              <span className="font-black text-2xl tracking-tighter text-black uppercase">
                Culinary<span className="text-[#DC143C]">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            {isStaff && (
              <Link href="/dashboard" className="font-black uppercase text-sm tracking-widest text-black hover:text-[#DC143C] transition-colors">Dashboard</Link>
            )}
            <Link href="/menu" className="font-black uppercase text-sm tracking-widest text-[#DC143C] underline decoration-4 underline-offset-4">Explore Menu</Link>
            <Link href="/orders" className="font-black uppercase text-sm tracking-widest text-black hover:text-[#DC143C] transition-colors">My Orders</Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Cart button - show for anyone on customer-facing pages */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-white border-2 border-black p-2.5 rounded-lg shadow-[3px_3px_0px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <ShoppingCart size={22} className="text-black" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#DC143C] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <button
                onClick={logout}
                className="bg-black text-white px-6 py-2.5 rounded-lg font-black uppercase text-sm border-2 border-black shadow-[4px_4px_0px_0px_#DC143C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Logout
              </button>
            ) : (
              <Link href="/login" className="bg-black text-white px-6 py-2.5 rounded-lg font-black uppercase text-sm border-2 border-black shadow-[4px_4px_0px_0px_#DC143C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Login
              </Link>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 border-2 border-black rounded-lg bg-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 border-t-2 border-black bg-[#FFFFF0] space-y-4">
            <Link href="/menu" className="block font-black uppercase tracking-widest text-lg" onClick={() => setMobileMenuOpen(false)}>Menu</Link>
            {isStaff && <Link href="/dashboard" className="block font-black uppercase tracking-widest text-lg" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>}
          </div>
        )}
      </div>
    </nav>
  );
};
