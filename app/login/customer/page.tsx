'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, ArrowRight, Lock, Mail, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CustomerLoginPage() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // For now, just store customer email in localStorage for guest orders
            // Future: Implement proper customer auth with Supabase Auth
            localStorage.setItem('customerEmail', email);
            localStorage.setItem('customerLoggedIn', 'true');

            router.push('/menu');
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFFFFE] to-[#F5F5F5] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#DC143C] text-[#FFFFFE]">
                            <User size={28} />
                        </div>
                        <h1 className="text-3xl font-bold text-[#111111]">
                            Customer<span className="text-[#DC143C]">Login</span>
                        </h1>
                    </div>
                    <p className="text-[#111111]/60">Sign in to track your orders</p>
                </div>

                {/* Main Card */}
                <div className="bg-[#FFFFFE] border-2 border-[#111111] rounded-lg shadow-lg p-8">
                    {/* Restaurant Owner Link */}
                    <div className="mb-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm">
                        <p className="font-bold text-gray-800 mb-1">🍴 Restaurant Owner?</p>
                        <p className="text-gray-600">
                            <Link href="/login" className="underline font-bold hover:text-[#DC143C]">
                                Go to Restaurant Dashboard →
                            </Link>
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-[#DC143C] border-2 border-black rounded-xl text-white text-sm font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-black uppercase tracking-wider text-black mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-black rounded-xl focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none transition-all font-bold placeholder:text-black/20"
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-black uppercase tracking-wider text-black mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-black rounded-xl focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none transition-all font-bold placeholder:text-black/20"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[#DC143C] text-white rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link href="/login/customer/register" className="font-bold text-[#DC143C] hover:underline">
                                Create one
                            </Link>
                        </p>
                    </div>

                    {/* Guest Checkout Link */}
                    <div className="mt-4 text-center">
                        <Link href="/menu" className="text-sm text-gray-500 hover:underline">
                            Continue as guest →
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-[#111111]/50 mt-6">
                    © 2025 CulinaryAI. All rights reserved.
                </p>
            </div>
        </div>
    );
}
