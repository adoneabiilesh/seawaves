'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ShoppingCart, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoMenuScanner } from '@/components/demo/DemoMenuScanner';
import { saveDemoProducts, getDemoProducts, hasDemoProducts } from '@/lib/demoStorage';
import { Product } from '@/types';

export default function DemoPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        // Load any existing products from session storage
        const existing = getDemoProducts();
        if (existing.length > 0) {
            setProducts(existing);
            setShowScanner(true);
        }
    }, []);

    const handleProductsGenerated = (newProducts: Product[]) => {
        setProducts(newProducts);
        saveDemoProducts(newProducts);
    };

    const handleContinueToCart = () => {
        router.push('/demo/cart');
    };

    return (
        <div className="min-h-screen bg-[#FFFFF0]">
            {/* Header */}
            <nav className="border-b-4 border-black px-4 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-black shadow-[3px_3px_0px_0px_#DC143C]">C</div>
                    <span className="font-black text-2xl uppercase tracking-tighter">CulinaryAI</span>
                </Link>
                <div className="flex items-center gap-4">
                    {products.length > 0 && (
                        <Button
                            onClick={handleContinueToCart}
                            className="bg-[#DC143C] text-white font-bold hover:bg-[#DC143C]/90"
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Cart ({products.length})
                        </Button>
                    )}
                    <Link href="/login">
                        <Button variant="outline" className="border-2 border-black font-bold">
                            Login
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 py-12">
                {!showScanner ? (
                    // Welcome Section
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-[#DC143C]/10 text-[#DC143C] px-4 py-2 rounded-full text-sm font-bold mb-6">
                            <ChefHat className="w-4 h-4" />
                            Free Demo - No Registration Required
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6">
                            Transform Your Menu<br />
                            <span className="text-[#DC143C]">In 60 Seconds</span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
                            Upload a photo of your menu card or type your dishes.
                            Our AI will instantly digitize everything with prices, descriptions, and translations.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Button
                                onClick={() => setShowScanner(true)}
                                className="bg-black text-white px-8 py-6 text-lg font-bold shadow-[6px_6px_0px_0px_#DC143C] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                            >
                                <Sparkles className="mr-2 h-5 w-5" />
                                Start Demo
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>

                        {/* Features */}
                        <div className="grid md:grid-cols-3 gap-6 text-left">
                            <div className="bg-white border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_black]">
                                <div className="text-3xl mb-3">📸</div>
                                <h3 className="font-bold text-lg mb-2">Scan Any Menu</h3>
                                <p className="text-gray-600 text-sm">Take a photo of your paper menu and AI extracts every dish</p>
                            </div>
                            <div className="bg-white border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_black]">
                                <div className="text-3xl mb-3">🌍</div>
                                <h3 className="font-bold text-lg mb-2">Auto-Translate</h3>
                                <p className="text-gray-600 text-sm">Instantly translate to English, Italian, French & German</p>
                            </div>
                            <div className="bg-white border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_black]">
                                <div className="text-3xl mb-3">🛒</div>
                                <h3 className="font-bold text-lg mb-2">Ready to Sell</h3>
                                <p className="text-gray-600 text-sm">Complete with prices, allergens, and ordering system</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Scanner Section
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black">Scan Your Menu</h1>
                                <p className="text-gray-600">Upload a photo or type dish names to generate your digital menu</p>
                            </div>
                            {products.length > 0 && (
                                <Button
                                    onClick={handleContinueToCart}
                                    className="bg-[#DC143C] text-white font-bold hover:bg-[#DC143C]/90 shadow-[4px_4px_0px_0px_black]"
                                >
                                    Continue to Cart
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <DemoMenuScanner
                            onProductsGenerated={handleProductsGenerated}
                            existingProducts={products}
                        />

                        {/* Approved Products Summary */}
                        {products.length > 0 && (
                            <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_black]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">✅ {products.length} Products Ready</h3>
                                        <p className="text-gray-500 text-sm">These will be added to your digital menu</p>
                                    </div>
                                    <Button
                                        onClick={handleContinueToCart}
                                        className="bg-black text-white font-bold shadow-[4px_4px_0px_0px_#DC143C]"
                                    >
                                        View Cart & Continue
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
