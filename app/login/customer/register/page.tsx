'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, Loader2, User, Phone } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/db';
import bcrypt from 'bcryptjs';

export default function CustomerRegisterPage() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (!firstName || !lastName || !email || !password) {
            setError('Please fill all required fields');
            setIsLoading(false);
            return;
        }

        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user in database
            const { data, error: insertError } = await supabase
                .from('User')
                .insert({
                    firstName,
                    lastName,
                    email,
                    phone: phone || null,
                    password: hashedPassword,
                    role: 'customer'
                })
                .select()
                .single();

            if (insertError) {
                if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
                    setError('An account with this email already exists');
                } else {
                    setError('Registration failed. Please try again.');
                }
                setIsLoading(false);
                return;
            }

            setSuccess('Account created successfully! Redirecting...');

            // Store customer info in localStorage
            localStorage.setItem('customerEmail', email);
            localStorage.setItem('customerId', data.id);
            localStorage.setItem('customerLoggedIn', 'true');
            localStorage.setItem('customerName', `${firstName} ${lastName}`);

            // Redirect to menu
            setTimeout(() => router.push('/menu'), 1500);

        } catch (err) {
            setError('An error occurred during registration');
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
                            Create<span className="text-[#DC143C]">Account</span>
                        </h1>
                    </div>
                    <p className="text-[#111111]/60">Sign up for faster checkout & order tracking</p>
                </div>

                {/* Main Card */}
                <div className="bg-[#FFFFFE] border-2 border-[#111111] rounded-lg shadow-lg p-8">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-[#DC143C] border-2 border-black rounded-xl text-white text-sm font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-500 border-2 border-black rounded-xl text-white text-sm font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            {success}
                        </div>
                    )}

                    {/* Register Form */}
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-black mb-1">First Name *</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg font-bold focus:shadow-[2px_2px_0px_0px_black] outline-none"
                                    placeholder="John"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-black mb-1">Last Name *</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg font-bold focus:shadow-[2px_2px_0px_0px_black] outline-none"
                                    placeholder="Doe"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-black mb-1">Email Address *</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black rounded-lg font-bold focus:shadow-[2px_2px_0px_0px_black] outline-none"
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-black mb-1">Phone (Optional)</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black rounded-lg font-bold focus:shadow-[2px_2px_0px_0px_black] outline-none"
                                    placeholder="+1 (555) 123-4567"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-black mb-1">Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black rounded-lg font-bold focus:shadow-[2px_2px_0px_0px_black] outline-none"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[#DC143C] text-white rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Create Account <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login/customer" className="font-bold text-[#DC143C] hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    {/* Guest Checkout Link */}
                    <div className="mt-4 text-center">
                        <Link href="/menu" className="text-sm text-gray-500 hover:underline">
                            Skip for now and continue as guest →
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
