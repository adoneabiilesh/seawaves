'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, ArrowRight, Building2, Mail, Lock, User, Zap, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
    id: string;
    name: string;
    slug: string;
    regularPrice: number;
    offerPrice: number;
    description: string;
    features: string[];
    limits: { maxProducts: number; maxTables: number; aiScansPerMonth: number };
}

const DEFAULT_PLANS: Plan[] = [
    {
        id: 'starter',
        name: 'Starter',
        slug: 'starter',
        regularPrice: 29,
        offerPrice: 10,
        description: 'Perfect for small restaurants getting started',
        features: ['AI Menu Scanner', 'Up to 50 products', '5 Tables', 'QR Code ordering', 'Basic analytics'],
        limits: { maxProducts: 50, maxTables: 5, aiScansPerMonth: 10 }
    },
    {
        id: 'pro',
        name: 'Pro',
        slug: 'pro',
        regularPrice: 60,
        offerPrice: 29,
        description: 'For growing restaurants with advanced needs',
        features: ['Everything in Starter', 'Unlimited products', '25 Tables', 'Advanced AI features', 'Full analytics', 'Priority support'],
        limits: { maxProducts: -1, maxTables: 25, aiScansPerMonth: 100 }
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        slug: 'enterprise',
        regularPrice: 100,
        offerPrice: 79,
        description: 'Complete solution for multi-location restaurants',
        features: ['Everything in Pro', 'Unlimited tables', 'Multi-location', 'API access', 'Dedicated support', 'Custom integrations'],
        limits: { maxProducts: -1, maxTables: -1, aiScansPerMonth: -1 }
    }
];

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<'plans' | 'details'>('plans');
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        restaurantName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Fetch plans from database
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch('/api/plans');
                if (res.ok) {
                    const data = await res.json();
                    if (data.plans?.length > 0) {
                        setPlans(data.plans);
                    }
                }
            } catch (e) {
                // Use default plans
            }
        };
        fetchPlans();
    }, []);

    const handlePlanSelect = (plan: Plan) => {
        setSelectedPlan(plan);
        setStep('details');
    };

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
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    restaurantName: formData.restaurantName,
                    email: formData.email,
                    password: formData.password,
                    planSlug: selectedPlan?.slug || 'starter'
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Restaurant created! Redirecting to login...');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                toast.error(data.error || 'Registration failed');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        }

        setIsLoading(false);
    };

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

            {step === 'plans' ? (
                <div className="max-w-5xl mx-auto px-4 py-12">
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-[#DC143C]/10 text-[#DC143C] px-4 py-2 rounded-full text-sm font-bold mb-4">
                            <Camera className="w-4 h-4" />
                            AI-Powered Menu Digitization
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Transform Your Menu Into a<br />
                            <span className="text-[#DC143C]">Digital Ordering System</span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Upload a photo of your menu card, and our AI converts it into a fully functional
                            online ordering system in minutes. Start accepting orders today.
                        </p>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan, index) => (
                            <div
                                key={plan.id || plan.slug}
                                className={`relative bg-white rounded-2xl border-2 p-6 transition-all cursor-pointer hover:shadow-xl ${index === 1
                                        ? 'border-[#DC143C] shadow-[0_0_0_4px_rgba(220,20,60,0.1)]'
                                        : 'border-black hover:border-[#DC143C]'
                                    }`}
                                onClick={() => handlePlanSelect(plan)}
                            >
                                {index === 1 && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#DC143C] text-white text-xs font-bold px-3 py-1 rounded-full">
                                        MOST POPULAR
                                    </div>
                                )}

                                <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name}</h3>
                                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-[#DC143C]">€{plan.offerPrice}</span>
                                        <span className="text-gray-400 line-through">€{plan.regularPrice}</span>
                                        <span className="text-sm text-gray-500">/month</span>
                                    </div>
                                    <div className="text-sm text-green-600 font-bold">
                                        Save €{(plan.regularPrice - plan.offerPrice).toFixed(0)}/month
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${index === 1
                                            ? 'bg-[#DC143C] text-white hover:bg-[#DC143C]/90'
                                            : 'bg-black text-white hover:bg-gray-800'
                                        }`}
                                >
                                    Get Started <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Trust */}
                    <div className="text-center mt-12 text-gray-500 text-sm">
                        <p>✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime</p>
                    </div>
                </div>
            ) : (
                <div className="max-w-md mx-auto px-4 py-12">
                    <button
                        onClick={() => setStep('plans')}
                        className="text-sm text-gray-500 hover:text-black mb-6 flex items-center gap-1"
                    >
                        ← Back to plans
                    </button>

                    <div className="bg-white rounded-2xl border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        {/* Selected Plan Badge */}
                        <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Selected Plan</p>
                                <p className="font-bold">{selectedPlan?.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-[#DC143C]">€{selectedPlan?.offerPrice}</p>
                                <p className="text-xs text-gray-500">/month</p>
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 mb-6">Create Your Restaurant</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl focus:border-[#DC143C] outline-none"
                                            placeholder="John"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-[#DC143C] outline-none"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.restaurantName}
                                        onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl focus:border-[#DC143C] outline-none"
                                        placeholder="Pizzeria Roma"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Your URL: <span className="font-mono">{formData.restaurantName.toLowerCase().replace(/\s+/g, '-') || 'your-restaurant'}.culinaryai.com</span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl focus:border-[#DC143C] outline-none"
                                        placeholder="john@pizzeria.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl focus:border-[#DC143C] outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl focus:border-[#DC143C] outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90 text-white py-4 rounded-xl font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? 'Creating...' : 'Create My Restaurant'}
                                {!isLoading && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </form>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            By signing up, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
