'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ChefHat, ArrowRight, Lock, Mail, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
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
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push('/admin');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] to-[#FFF5F5] flex flex-col">
      {/* Header */}
      <div className="border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-2xl">
            <div className="w-10 h-10 bg-[#DC143C] rounded-lg flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            Culinary<span className="text-[#DC143C]">AI</span>
          </Link>
          <Link href="/register" className="text-sm font-bold text-gray-600 hover:text-black">
            Don't have an account? <span className="text-[#DC143C]">Get Started</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Guest Order Banner */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-blue-800">
              <span className="font-bold">Just want to order food?</span> No login required!{' '}
              <Link href="/menu" className="text-blue-600 underline font-bold">
                Browse our menu
              </Link>{' '}
              and checkout as a guest.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-gray-900">Restaurant Login</h1>
              <p className="text-gray-500 text-sm mt-1">Sign in to your dashboard</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl focus:border-[#DC143C] outline-none transition-colors"
                    placeholder="name@restaurant.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl focus:border-[#DC143C] outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-xl font-bold text-lg shadow-[4px_4px_0px_0px_#DC143C] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-[#DC143C]">
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Register CTA */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              New to CulinaryAI?{' '}
              <Link href="/register" className="font-bold text-[#DC143C] hover:underline">
                Create your restaurant account →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
