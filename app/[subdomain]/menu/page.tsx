'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Search, SlidersHorizontal, ChevronLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Product, CartItem, Category } from '@/types';
import { supabase } from '@/lib/db';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { FeedbackModal } from '@/components/FeedbackModal';
import { cn } from '@/lib/utils';
import { useApp } from '@/app/providers';

export default function TenantMenuPage({ params }: { params: { subdomain: string } }) {
    const { toast } = useToast();
    const { cart, setCart, addons, setIsCartOpen } = useApp();

    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // We can also use params.subdomain here to filter if we didn't do it in Provider
            const { data: menuData } = await supabase.from('Product').select('*').eq('available', true);
            const { data: catData } = await supabase.from('Category').select('*').order('displayOrder');

            if (menuData) setProducts(menuData);
            if (catData) setCategories(catData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleAddToCart = (cartItem: CartItem) => {
        setCart((prev: any[]) => {
            const existing = prev.find((item: any) => item.product.id === cartItem.product.id);
            if (existing) {
                return prev.map((item: any) =>
                    item.product.id === cartItem.product.id
                        ? { ...item, quantity: item.quantity + cartItem.quantity }
                        : item
                );
            }
            return [...prev, cartItem];
        });
        toast({ title: "Added to Cart", description: `${cartItem.product.name.en} added.` });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FFFFF0]">
                <Loader2 className="h-8 w-8 animate-spin text-black" />
            </div>
        );
    }

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
        const matchesSearch = p.name.en.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categoriesList = [{ id: 'all', name: { en: 'All' }, displayOrder: -1 }, ...categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    return (
        <div className="min-h-screen bg-[#FFFFF0] text-black pb-32 font-sans selection:bg-[#DC143C] selection:text-white">

            {/* Top Bar */}
            <div className="sticky top-0 z-40 bg-[#FFFFF0] px-4 pt-4 pb-2 border-b-2 border-black/10">

                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-black" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-12 py-4 bg-white text-black rounded-full border-2 border-black focus:ring-0 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder-black/50 font-bold"
                        placeholder="Search our menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <SlidersHorizontal className="h-5 w-5 text-black cursor-pointer" />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {categoriesList.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "whitespace-nowrap px-6 py-2 rounded-full font-black uppercase text-sm tracking-wide transition-all border-2 border-black",
                                selectedCategory === cat.id
                                    ? "bg-[#DC143C] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                                    : "bg-white text-black hover:bg-gray-100"
                            )}
                        >
                            {cat.name.en || cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <main className="px-4 py-8 space-y-10">
                {/* Featured Section */}
                {selectedCategory === 'all' && !searchQuery && (
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">Chef's Picks</h2>
                        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4">
                            {products.slice(0, 3).map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => handleProductClick(product)}
                                    className="flex-shrink-0 w-64 bg-white rounded-3xl p-4 relative cursor-pointer border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                >
                                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative border-2 border-black">
                                        <img src={product.imageUrl || "/placeholder.png"} className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="font-black text-lg uppercase leading-none mb-2">{product.name.en}</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-black text-black" />
                                            <span className="text-sm font-bold">4.9</span>
                                        </div>
                                        <div className="font-black text-xl text-[#DC143C]">${product.price}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main List */}
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
                        {selectedCategory === 'all' ? 'Our Menu' : categories.find(c => c.id === selectedCategory)?.name.en}
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => handleProductClick(product)}
                                className="bg-white rounded-3xl p-3 relative cursor-pointer flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-transform"
                            >
                                <div className="aspect-square rounded-2xl overflow-hidden mb-3 relative border-2 border-black">
                                    <img src={product.imageUrl || "/placeholder.png"} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="font-black text-sm uppercase leading-tight mb-auto">{product.name.en}</h3>
                                <div className="mt-3 flex justify-between items-center">
                                    <span className="font-black text-[#DC143C]">${product.price}</span>
                                    <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-black hover:bg-[#DC143C] transition-colors">
                                        <span className="text-sm font-bold">+</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Cart Button */}
            {cart.length > 0 && (
                <div className="fixed bottom-6 left-4 right-4 z-50">
                    <div className="bg-black text-white rounded-full py-4 px-6 flex items-center justify-between shadow-[4px_4px_0px_0px_#DC143C] border-2 border-black cursor-pointer active:translate-y-[2px] active:shadow-none transition-all" onClick={() => setIsCartOpen(true)}>
                        <div className="flex items-center gap-4">
                            <div className="bg-[#DC143C] text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white">
                                {cart.reduce((a: number, b: any) => a + b.quantity, 0)}
                            </div>
                            <span className="font-black text-xl">${cart.reduce((a: number, b: any) => a + (b.product.price * b.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div className="font-black uppercase tracking-wider text-sm flex items-center gap-2">
                            Checkout <ChevronLeft className="w-5 h-5 rotate-180" />
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Button */}
            <div className="fixed bottom-24 right-4 z-40">
                <Button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="rounded-full w-12 h-12 bg-white border-2 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] p-0 flex items-center justify-center"
                >
                    <Star className="w-6 h-6 fill-current" />
                </Button>
            </div>

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                onSubmit={(rating, comment) => {
                    toast({ title: "Thanks for your feedback!", description: `You rated us ${rating} stars.` });
                }}
            />

            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onAddToCart={handleAddToCart}
                    addons={addons}
                />
            )}
        </div>
    );
}
