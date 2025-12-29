'use client';

import React from 'react';
import Link from 'next/link';
import { ChefHat, ArrowRight, Sparkles, ShoppingBag, UtensilsCrossed, MonitorPlay, Zap, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#FFFFF0] text-black font-sans selection:bg-[#DC143C] selection:text-white">

            {/* Nav */}
            <nav className="border-b-4 border-black px-4 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-black shadow-[3px_3px_0px_0px_#DC143C]">C</div>
                    <span className="font-black text-2xl uppercase tracking-tighter">CulinaryAI</span>
                </div>
                <div className="hidden md:flex gap-8 font-black uppercase text-xs tracking-widest">
                    <a href="#features" className="hover:text-[#DC143C]">Features</a>
                    <a href="#pricing" className="hover:text-[#DC143C]">Pricing</a>
                </div>
                <Link href="/login">
                    <Button className="border-2 border-black bg-white text-black font-black uppercase text-xs px-6 py-2 rounded-full shadow-[3px_3px_0px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        Login
                    </Button>
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 px-4 overflow-hidden border-b-4 border-black">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-4 py-2 rounded-full mb-8 shadow-[4px_4px_0px_0px_black] animate-bounce">
                        <Sparkles className="w-5 h-5 text-[#DC143C]" />
                        <span className="font-black uppercase tracking-tighter text-xs">The Future of Dining is Here</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
                        Operational <br />
                        <span className="text-[#DC143C] drop-shadow-[4px_4px_0px_black]">Excellence</span> <br />
                        Powered by AI
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl font-bold mb-12 text-black/70 italic">
                        The unified operating system for modern restaurants. From QR menus to AI-powered kitchen optimization.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link href="/demo" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-80 py-8 bg-black text-white border-4 border-black rounded-2xl text-xl font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_#DC143C] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all flex items-center justify-center gap-3">
                                Try Demo Free <ArrowRight className="w-6 h-6" />
                            </Button>
                        </Link>
                        <Link href="/register" className="text-sm font-bold text-black/60 hover:text-black underline">
                            Skip to Registration
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature Bento Grid */}
            <section id="features" className="py-24 px-4 bg-white border-b-4 border-black">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Everything you need</h2>
                        <div className="w-24 h-2 bg-black mx-auto"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* QR Ordering */}
                        <div className="md:col-span-8 bg-[#FFFFF0] border-4 border-black p-8 rounded-[40px] shadow-[8px_8px_0px_0px_black] flex flex-col justify-between">
                            <div>
                                <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6 border-2 border-black">
                                    <UtensilsCrossed size={32} />
                                </div>
                                <h3 className="text-3xl font-black uppercase mb-4">Smart QR Ordering</h3>
                                <p className="text-lg font-bold text-black/60 max-w-lg">
                                    Let your customers order and pay directly from their tables. No apps, no friction, just high-speed hospitality.
                                </p>
                            </div>
                        </div>

                        {/* AI Kitchen */}
                        <div className="md:col-span-4 bg-black text-white border-4 border-black p-8 rounded-[40px] shadow-[8px_8px_0px_0px_#DC143C]">
                            <div className="w-16 h-16 bg-[#DC143C] text-white rounded-2xl flex items-center justify-center mb-6 border-2 border-white">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-3xl font-black uppercase mb-4 text-[#FFFFF0]">AI Kitchen KDS</h3>
                            <p className="text-lg font-bold text-white/60">
                                Predictive prep times and intelligent staging to keep your kitchen running at peak efficiency.
                            </p>
                        </div>

                        {/* Multi-Tenant */}
                        <div className="md:col-span-4 bg-[#DC143C] text-white border-4 border-black p-8 rounded-[40px] shadow-[8px_8px_0px_0px_black]">
                            <div className="w-16 h-16 bg-white text-[#DC143C] rounded-2xl flex items-center justify-center mb-6 border-2 border-black">
                                <Globe size={32} />
                            </div>
                            <h3 className="text-3xl font-black uppercase mb-4">Branded Subdomains</h3>
                            <p className="text-lg font-bold text-white/90">
                                Every restaurant gets their own custom portal at restaurant.yourplatform.com.
                            </p>
                        </div>

                        {/* Analytics */}
                        <div className="md:col-span-8 bg-white border-4 border-black p-8 rounded-[40px] shadow-[8px_8px_0px_0px_black] flex items-center gap-8">
                            <div className="flex-1">
                                <h3 className="text-3xl font-black uppercase mb-4">Deep Analytics</h3>
                                <p className="text-lg font-bold text-black/60">
                                    Track inventory, sales, and employee performance with real-time dashboards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t-4 border-black bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center font-black">C</div>
                        <span className="font-black text-xl uppercase tracking-tighter">CulinaryAI</span>
                    </div>
                    <div className="flex gap-8 font-black uppercase text-sm tracking-widest text-black/40">
                        <span>© 2024 CulinaryAI</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
