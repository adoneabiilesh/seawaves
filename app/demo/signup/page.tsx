'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Mail, Lock, User, Sparkles, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDemoProducts, clearAllDemoData } from '@/lib/demoStorage';
import { Product } from '@/types';
import { toast } from 'sonner';

export default function DemoSignupPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        restaurantName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const stored = getDemoProducts();
        if (stored.length === 0) {
            router.push('/demo');
        } else {
            setProducts(stored);
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            // Register with demo products
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    restaurantName: formData.restaurantName,
                    email: formData.email,
                    password: formData.password,
                    planSlug: 'starter',
                    demoProducts: products.map(p => ({
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        category: p.category,
                        imageUrl: p.imageUrl,
                        nutrition: p.nutrition,
                        allergens: p.allergens,
                        ingredients: p.ingredients,
                        available: p.available
                    }))
                })
            });

            const data = await res.json();

            if (res.ok) {
                clearAllDemoData();
                toast.success('Restaurant created! Your menu has been imported. Redirecting to login...');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                toast.error(data.error || 'Registration failed');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        }

        setIsLoading(false);
    };

    const subdomain = formData.restaurantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'your-restaurant';

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] to-[#FFF5F5]">
            {/* Header */}
            <div className="border-b-4 border-black bg-white">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-black text-2xl">
                        <div className="w-10 h-10 bg-[#DC143C] rounded-lg flex items-center justify-center text-white">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        Culinary<span className="text-[#DC143C]">AI</span>
                    </Link>
                    <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-black">
                        Already have an account? <span className="text-[#DC143C]">Sign In</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Products Summary */}
                    <div className="lg:col-span-2">
                        <Card className="border-2 border-black shadow-[6px_6px_0px_0px_#DC143C] sticky top-8">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Your Menu Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {products.slice(0, 8).map(product => (
                                        <div key={product.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                            <div className="w-12 h-12 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name.en} className="w-full h-full object-cover" />
                                                ) : null}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{product.name.en}</p>
                                                <p className="text-xs text-gray-500">${product.price.toFixed(2)}</p>
                                            </div>
                                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        </div>
                                    ))}
                                    {products.length > 8 && (
                                        <p className="text-center text-sm text-gray-500 py-2">
                                            +{products.length - 8} more products
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-600">Total Products</span>
                                        <span className="font-bold">{products.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Languages</span>
                                        <span className="font-bold">4 (EN, IT, FR, DE)</span>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-green-800 text-sm font-medium">
                                        ✓ All products will be imported to your restaurant
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Registration Form */}
                    <div className="lg:col-span-3">
                        <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <CardHeader>
                                <CardTitle className="text-2xl">Create Your Restaurant</CardTitle>
                                <p className="text-gray-500">Start your 14-day free trial</p>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input
                                                    type="text"
                                                    required
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    className="pl-10 border-2 border-black"
                                                    placeholder="John"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                            <Input
                                                type="text"
                                                required
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="border-2 border-black"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type="text"
                                                required
                                                value={formData.restaurantName}
                                                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                                                className="pl-10 border-2 border-black"
                                                placeholder="Pizzeria Roma"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Your URL: <span className="font-mono bg-gray-100 px-1">{subdomain}.culinaryai.com</span>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="pl-10 border-2 border-black"
                                                placeholder="john@pizzeria.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="pl-10 border-2 border-black"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type="password"
                                                required
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="pl-10 border-2 border-black"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-6 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                                    >
                                        {isLoading ? 'Creating...' : 'Create Restaurant & Import Menu'}
                                        {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <p className="text-xs text-gray-500">
                                        ✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        By signing up, you agree to our Terms of Service and Privacy Policy
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
