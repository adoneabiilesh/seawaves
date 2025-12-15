'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChefHat, Utensils, ArrowRight, Lock, User as UserIcon, MapPin, QrCode, Mail, Building } from 'lucide-react';
import { useApp } from '../providers';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useApp();
  
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'customer';
  const tableParam = searchParams.get('table');

  const [activeRole, setActiveRole] = useState<'admin' | 'customer'>(initialRole);
  const [isSignup, setIsSignup] = useState(false);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState(tableParam || '');
  
  // Admin Login States
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Signup States
  const [signupName, setSignupName] = useState('');
  const [signupRestaurant, setSignupRestaurant] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (tableParam) {
        setTableNumber(tableParam);
        setActiveRole('customer');
    }
  }, [tableParam]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeRole === 'admin') {
      if (isSignup) {
        // Mock Signup
        if (!signupName || !signupRestaurant || !signupEmail || !signupPassword) {
          setError('Please fill all fields');
          return;
        }
        setUser({
          id: Date.now().toString(),
          name: signupName,
          role: 'admin',
        });
        router.push('/admin');
      } else {
        // Mock Admin Login
        if (!adminEmail || !adminPassword) {
          setError('Please enter email and password');
          return;
        }
        setUser({
          id: 'admin-1',
          name: 'Admin User',
          role: 'admin',
        });
        router.push('/admin');
      }
    } else {
      // Customer Login
      if (!customerName || !tableNumber) {
        setError('Please enter your name and table number');
        return;
      }
      setUser({
        id: Date.now().toString(),
        name: customerName,
        role: 'customer',
        tableNumber: tableNumber,
      });
      router.push('/menu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-8 ${activeRole === 'admin' ? 'bg-slate-900' : 'bg-brand-600'}`}>
          <div className="flex items-center justify-center mb-4">
            <div className={`h-16 w-16 rounded-2xl ${activeRole === 'admin' ? 'bg-indigo-600' : 'bg-white/20'} flex items-center justify-center`}>
              {activeRole === 'admin' ? <ChefHat size={32} className="text-white" /> : <Utensils size={32} className="text-white" />}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center">
            {activeRole === 'admin' ? 'Restaurant Admin' : 'Customer Login'}
          </h1>
        </div>

        {/* Role Toggle */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-2">
          <button
            onClick={() => { setActiveRole('customer'); setIsSignup(false); setError(''); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeRole === 'customer' 
                ? 'bg-brand-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Utensils size={18} className="inline mr-2" />
            Customer
          </button>
          <button
            onClick={() => { setActiveRole('admin'); setIsSignup(false); setError(''); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeRole === 'admin' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChefHat size={18} className="inline mr-2" />
            Admin
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {activeRole === 'customer' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <UserIcon size={16} />
                  Your Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} />
                  Table Number
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Table 5"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Start Ordering <ArrowRight size={20} />
              </button>
            </>
          ) : (
            <>
              {!isSignup ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Mail size={16} />
                      Email
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                      placeholder="admin@restaurant.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Lock size={16} />
                      Password
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    Login <ArrowRight size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSignup(true)}
                    className="w-full text-slate-600 hover:text-slate-900 font-medium py-2"
                  >
                    Don't have an account? Sign up
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <UserIcon size={16} />
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Building size={16} />
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={signupRestaurant}
                      onChange={(e) => setSignupRestaurant(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                      placeholder="My Restaurant"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Mail size={16} />
                      Email
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                      placeholder="admin@restaurant.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Lock size={16} />
                      Password
                    </label>
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    Create Account <ArrowRight size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSignup(false)}
                    className="w-full text-slate-600 hover:text-slate-900 font-medium py-2"
                  >
                    Already have an account? Login
                  </button>
                </>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}





