'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Trash2, Edit3, Check, X, ShoppingCart, DollarSign, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getDemoProducts, saveDemoProducts, updateDemoProduct, removeDemoProduct } from '@/lib/demoStorage';
import { Product } from '@/types';

export default function DemoCartPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ name: string; price: number }>({ name: '', price: 0 });

    useEffect(() => {
        const stored = getDemoProducts();
        if (stored.length === 0) {
            router.push('/demo');
        } else {
            setProducts(stored);
        }
    }, [router]);

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setEditForm({ name: product.name.en, price: product.price });
    };

    const handleSaveEdit = (product: Product) => {
        const updated: Product = {
            ...product,
            name: { ...product.name, en: editForm.name },
            price: editForm.price
        };
        updateDemoProduct(updated);
        setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
        setEditingId(null);
    };

    const handleDelete = (productId: string) => {
        removeDemoProduct(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
    };

    const handleToggleAvailability = (product: Product) => {
        const updated = { ...product, available: !product.available };
        updateDemoProduct(updated);
        setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    };

    const totalValue = products.reduce((sum, p) => sum + (p.available ? p.price : 0), 0);
    const availableCount = products.filter(p => p.available).length;

    const handleProceedToCheckout = () => {
        router.push('/demo/checkout');
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
                    <div className="text-right hidden sm:block">
                        <p className="text-sm text-gray-500">Menu Value</p>
                        <p className="font-bold text-xl">${totalValue.toFixed(2)}</p>
                    </div>
                    <Link href="/login">
                        <Button variant="outline" className="border-2 border-black font-bold">
                            Login
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Back Button */}
                <Link href="/demo" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Add More Items
                </Link>

                {/* Progress Indicator */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">✓</div>
                        <span className="font-medium">Scan Menu</span>
                    </div>
                    <div className="flex-1 h-1 bg-black"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">2</div>
                        <span className="font-bold">Review Cart</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">3</div>
                        <span className="text-gray-500">Checkout</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black">Your Digital Menu</h1>
                        <p className="text-gray-600">{availableCount} of {products.length} products visible to customers</p>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid gap-4 mb-8">
                    {products.map(product => (
                        <Card
                            key={product.id}
                            className={`border-2 border-black overflow-hidden ${!product.available ? 'opacity-60' : ''}`}
                        >
                            <CardContent className="p-0">
                                <div className="flex">
                                    {/* Image */}
                                    <div className="w-32 h-32 flex-shrink-0 bg-gray-100">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name.en} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-4 flex flex-col justify-between">
                                        <div>
                                            {editingId === product.id ? (
                                                <div className="flex gap-2 mb-2">
                                                    <Input
                                                        value={editForm.name}
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="font-bold"
                                                    />
                                                    <Input
                                                        type="number"
                                                        value={editForm.price}
                                                        onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                                        className="w-24"
                                                        step="0.01"
                                                    />
                                                    <Button size="icon" onClick={() => handleSaveEdit(product)}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="outline" onClick={() => setEditingId(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="font-bold text-lg">{product.name.en}</h3>
                                                        <span className="font-bold text-xl text-[#DC143C]">${product.price.toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{product.description.en}</p>
                                                </>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                                            {(product.allergens && product.allergens.length > 0) && (
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                                    {product.allergens.length} allergens
                                                </span>
                                            )}
                                            <div className="flex-1"></div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleToggleAvailability(product)}
                                                title={product.available ? 'Hide from menu' : 'Show on menu'}
                                            >
                                                {product.available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(product.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Summary & CTA */}
                <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_black]">
                    <div className="grid sm:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-3xl font-black">{products.length}</p>
                            <p className="text-gray-500 text-sm">Total Products</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-3xl font-black text-green-600">{availableCount}</p>
                            <p className="text-gray-500 text-sm">Visible on Menu</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-3xl font-black text-[#DC143C]">${totalValue.toFixed(2)}</p>
                            <p className="text-gray-500 text-sm">Menu Value</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleProceedToCheckout}
                        className="w-full py-6 bg-black text-white font-bold text-lg shadow-[4px_4px_0px_0px_#DC143C] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                        See How Customers Order
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </main>
        </div>
    );
}
