'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShoppingCart, Clock, MapPin, CreditCard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDemoProducts } from '@/lib/demoStorage';
import { Product } from '@/types';

export default function DemoCheckoutPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    useEffect(() => {
        const stored = getDemoProducts().filter(p => p.available);
        if (stored.length === 0) {
            router.push('/demo');
        } else {
            setProducts(stored);
            // Add random quantities 1-3 to simulate a customer cart
            setCartItems(stored.slice(0, Math.min(5, stored.length)).map(p => ({
                product: p,
                quantity: Math.floor(Math.random() * 3) + 1
            })));
        }
    }, [router]);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const handlePlaceOrder = () => {
        setIsPlacingOrder(true);
        setTimeout(() => {
            setOrderPlaced(true);
            setIsPlacingOrder(false);
        }, 2000);
    };

    const handleGoToSignup = () => {
        router.push('/demo/signup');
    };

    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-[#FFFFF0] flex flex-col">
                {/* Header */}
                <nav className="border-b-4 border-black px-4 py-4 flex justify-between items-center bg-white">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-black shadow-[3px_3px_0px_0px_#DC143C]">C</div>
                        <span className="font-black text-2xl uppercase tracking-tighter">CulinaryAI</span>
                    </Link>
                </nav>

                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-lg mx-auto text-center">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <span className="text-5xl">✓</span>
                        </div>
                        <h1 className="text-4xl font-black mb-4">Order Placed!</h1>
                        <p className="text-xl text-gray-600 mb-8">
                            This is how your customers will experience ordering from your digital menu.
                        </p>

                        <Card className="border-2 border-black shadow-[6px_6px_0px_0px_#DC143C] mb-8">
                            <CardContent className="p-6 text-left">
                                <h3 className="font-bold text-lg mb-4">🎉 Ready to go live?</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3">
                                        <span className="text-green-500">✓</span>
                                        <span>{products.length} products digitized</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="text-green-500">✓</span>
                                        <span>Prices, descriptions & allergens</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="text-green-500">✓</span>
                                        <span>Multi-language support (4 languages)</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="text-green-500">✓</span>
                                        <span>QR code ordering system</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Button
                            onClick={handleGoToSignup}
                            className="w-full py-6 bg-[#DC143C] text-white font-bold text-lg shadow-[4px_4px_0px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            <Sparkles className="mr-2 h-5 w-5" />
                            Create My Restaurant - Start Free Trial
                        </Button>

                        <p className="text-gray-500 text-sm mt-4">
                            Your scanned products will be imported automatically
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFFF0]">
            {/* Header */}
            <nav className="border-b-4 border-black px-4 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-black shadow-[3px_3px_0px_0px_#DC143C]">C</div>
                    <span className="font-black text-2xl uppercase tracking-tighter">CulinaryAI</span>
                </Link>
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">
                    👁️ Customer Preview
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <Link href="/demo/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Menu Editor
                </Link>

                {/* Progress Indicator */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">✓</div>
                        <span className="font-medium">Scan Menu</span>
                    </div>
                    <div className="flex-1 h-1 bg-black"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">✓</div>
                        <span className="font-medium">Review Cart</span>
                    </div>
                    <div className="flex-1 h-1 bg-black"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">3</div>
                        <span className="font-bold">Checkout</span>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                    <p className="text-amber-800 font-medium">
                        <strong>Demo Preview:</strong> This simulates how customers will see your checkout page.
                        We've added sample items to show the experience.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-2xl font-black">Order Summary</h2>

                        {cartItems.map(item => (
                            <Card key={item.product.id} className="border-2 border-black">
                                <CardContent className="p-4 flex gap-4">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                        {item.product.imageUrl ? (
                                            <img src={item.product.imageUrl} alt={item.product.name.en} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h3 className="font-bold">{item.product.name.en}</h3>
                                            <span className="font-bold">${(item.product.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-1">{item.product.description.en}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-sm bg-gray-100 px-2 py-1 rounded">Qty: {item.quantity}</span>
                                            <span className="text-sm text-gray-500">@ ${item.product.price.toFixed(2)} each</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Payment Summary */}
                    <div>
                        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_black] sticky top-24">
                            <CardHeader>
                                <CardTitle>Payment</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax (8%)</span>
                                        <span>${tax.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-[#DC143C]">${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span>Table 5 - Your Restaurant</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span>Est. 15-20 mins</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <CreditCard className="h-4 w-4 text-gray-400" />
                                        <span>**** **** **** 4242</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={isPlacingOrder}
                                    className="w-full py-6 bg-[#DC143C] text-white font-bold shadow-[4px_4px_0px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                                >
                                    {isPlacingOrder ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            <ShoppingCart className="mr-2 h-5 w-5" />
                                            Place Order (Demo)
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-gray-500 text-center">
                                    This is a demo - no actual payment will be processed
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
