'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, SlidersHorizontal, MapPin, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Product, CartItem, Category } from '@/types';
import { supabase } from '@/lib/db';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { FeedbackModal } from '@/components/FeedbackModal';
import { cn } from '@/lib/utils';
import { useApp } from '@/app/providers';

export default function TenantDeliveryPage({ params }: { params: { subdomain: string } }) {
    const { toast } = useToast();
    const router = useRouter();
    const { cart, setCart, user, addons, setIsCartOpen } = useApp();

    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [address, setAddress] = useState('');

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
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

    const handlePlaceOrder = () => {
        if (!user) {
            router.push('/login?callbackUrl=/delivery');
            return;
        }
        if (!address) {
            toast({ title: "Address Required", description: "Please enter your address above.", variant: "destructive" });
            return;
        }
        toast({ title: "Order Placed", description: "Your delivery is being prepared (Demo)." });
        setCart([]);
        setIsFeedbackOpen(true);
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
        <div className="min-h-screen bg-[#FFFFF0] text-black pb-32 font-sans">
            <div className="px-4 pt-6 pb-2">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-xs font-black text-black/50 uppercase tracking-widest">Deliver to</p>
                        <div className="flex items-center gap-1 font-black text-lg underline decoration-[#DC143C] decoration-2 underline-offset-4">
                            <span className="truncate max-w-[200px]">{address || "Select Location"}</span>
                            <MapPin className="w-5 h-5 text-[#DC143C] fill-current" />
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <Input
                        placeholder="Enter Delivery Address"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="rounded-xl border-2 border-black bg-white focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow font-bold"
                    />
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-black" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-12 py-4 bg-white text-black rounded-full border-2 border-black focus:ring-0 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder-black/50 font-bold"
                        placeholder="Search for bit bites"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

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

            <main className="px-4 py-2 space-y-8">
                {selectedCategory === 'all' && !searchQuery && (
                    <div className="relative h-48 rounded-3xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black bg-[#DC143C]">
                        <div className="absolute inset-0 z-10 flex flex-col justify-center p-6">
                            <h1 className="text-4xl font-black text-[#FFFFF0] leading-none mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">DON'T YOU<br />HUNGRYYY<br />BABY!</h1>
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-black">
                        {selectedCategory === 'all' ? 'Recommended' : categories.find(c => c.id === selectedCategory)?.name.en}
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
