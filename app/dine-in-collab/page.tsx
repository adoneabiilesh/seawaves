'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Loader2, Search, SlidersHorizontal, ChevronLeft, Star,
    AlertCircle, Users, ShoppingBag, Trash2, Plus, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Product, CartItem, Category, TableSession, Addon } from '@/types';
import { supabase } from '@/lib/db';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { FeedbackModal } from '@/components/FeedbackModal';
import { GuestNameEntry } from '@/components/GuestNameEntry';
import { PaymentRequestModal } from '@/components/PaymentRequestModal';
import { useSharedCart, SharedCartItem } from '@/hooks/useSharedCart';
import { cn } from '@/lib/utils';
import { useApp } from '../providers';

export default function CollaborativeDineInPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tableNumber = searchParams.get('table');
    const sessionToken = searchParams.get('session');
    const { toast } = useToast();
    const { addons, restaurantId, setTableNumber } = useApp();

    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Session validation state
    const [session, setSession] = useState<TableSession | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [isValidatingSession, setIsValidatingSession] = useState(true);

    // Guest entry state
    const [showGuestEntry, setShowGuestEntry] = useState(true);
    const [existingGuests, setExistingGuests] = useState<{ name: string; color: string }[]>([]);

    // Shared cart hook - only initialize after guest entry
    const [guestNameEntered, setGuestNameEntered] = useState<string | null>(null);
    const sharedCart = useSharedCart({
        tableSessionId: session?.id || '',
        guestName: guestNameEntered || undefined
    });

    // Cart drawer state for mobile
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Listen for payment requests
    useEffect(() => {
        if (!session?.id) return;

        const channel = supabase
            .channel(`session_${session.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'TableSession',
                    filter: `id=eq.${session.id}`
                },
                (payload) => {
                    if ((payload.new as any).paymentRequested && !(session as any).paymentRequested) {
                        setShowPaymentModal(true);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [session?.id]);

    // Validate session on mount
    useEffect(() => {
        validateSession();
    }, [tableNumber, restaurantId]);

    const validateSession = async () => {
        if (!tableNumber) {
            setSessionError('No table number provided. Please scan the QR code at your table.');
            setIsValidatingSession(false);
            return;
        }

        try {
            const url = `/api/sessions/validate?table=${tableNumber}${sessionToken ? `&session=${sessionToken}` : ''}${restaurantId ? `&restaurantId=${restaurantId}` : ''}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.valid && data.session) {
                setSession(data.session);
                setTableNumber(parseInt(tableNumber));
                setSessionError(null);
                localStorage.setItem('dineInSessionId', data.session.id);
                localStorage.setItem('dineInTableNumber', tableNumber);

                // Check if guest name already entered
                const savedName = localStorage.getItem(`guest_name_${data.session.id}`);
                if (savedName) {
                    setGuestNameEntered(savedName);
                    setShowGuestEntry(false);
                }

                // Fetch existing guests
                const { data: cartItems } = await supabase
                    .from('SharedCartItem')
                    .select('guestName, guestColor')
                    .eq('tableSessionId', data.session.id);

                if (cartItems) {
                    const uniqueGuests = Array.from(
                        new Map(cartItems.map((i: { guestName: string; guestColor: string }) => [i.guestName, { name: i.guestName, color: i.guestColor }])).values()
                    ) as { name: string; color: string }[];
                    setExistingGuests(uniqueGuests);
                }

                fetchData();
            } else {
                setSessionError(data.error || 'No active session. Please ask staff to open your table.');
            }
        } catch (error) {
            console.error('Session validation error:', error);
            setSessionError('Failed to validate session. Please try again.');
        }

        setIsValidatingSession(false);
    };

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

    const handleGuestEntry = (name: string) => {
        setGuestNameEntered(name);
        sharedCart.setGuestName(name);
        setShowGuestEntry(false);
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleAddToCart = async (cartItem: CartItem) => {
        try {
            await sharedCart.addItem(cartItem.product, cartItem.quantity, {
                notes: cartItem.notes,
                addons: cartItem.addons,
                variant: cartItem.selectedVariant
            });
            toast({ title: "Added to Table Order", description: `${cartItem.product.name.en} added by ${sharedCart.guestName}.` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
        }
    };

    // Show session validation loading
    if (isValidatingSession) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFFF0] p-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#DC143C] mb-4" />
                <p className="text-lg font-bold">Validating your table session...</p>
            </div>
        );
    }

    // Show session error
    if (sessionError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFFF0] p-6 text-center">
                <div className="bg-white border-2 border-black rounded-2xl p-8 max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <AlertCircle className="h-16 w-16 text-[#DC143C] mx-auto mb-4" />
                    <h1 className="text-2xl font-black uppercase mb-2">Session Invalid</h1>
                    <p className="text-gray-600 mb-6">{sessionError}</p>
                    <Button onClick={() => validateSession()} variant="outline">Try Again</Button>
                </div>
            </div>
        );
    }

    // Show guest name entry
    if (showGuestEntry && tableNumber) {
        return (
            <GuestNameEntry
                tableNumber={parseInt(tableNumber)}
                onComplete={handleGuestEntry}
                existingGuests={existingGuests}
            />
        );
    }

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

            {/* Top Bar with Guest Info */}
            <div className="sticky top-0 z-40 bg-[#FFFFF0] px-4 pt-4 pb-2 border-b-2 border-black/10">
                {/* Table & Guest Info */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-xl">Table {tableNumber}</span>
                        <div
                            className="px-3 py-1 rounded-full text-white text-sm font-bold"
                            style={{ backgroundColor: sharedCart.guestColor }}
                        >
                            {sharedCart.guestName}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        {new Set(sharedCart.items.map(i => i.guestId)).size} guests
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-black" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-12 py-4 bg-white text-black rounded-full border-2 border-black focus:ring-0 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder-black/50 font-bold"
                        placeholder="Search menu"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Categories (Italian Style) */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {categoriesList.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-all border-2 border-black",
                                selectedCategory === cat.id
                                    ? "bg-[#DC143C] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    : "bg-white text-black hover:bg-gray-100"
                            )}
                        >
                            {typeof cat.name === 'object' ? cat.name.en : cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <main className="px-4 py-6 space-y-8">
                {/* Product Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="bg-white rounded-3xl p-3 relative cursor-pointer flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-transform active:shadow-none"
                        >
                            <div className="aspect-square rounded-2xl overflow-hidden mb-3 relative border-2 border-black">
                                <img src={product.imageUrl || "/placeholder.png"} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="font-black text-sm uppercase leading-tight mb-auto">{product.name.en}</h3>
                            <div className="mt-3 flex justify-between items-center">
                                <span className="font-black text-[#DC143C]">${product.price}</span>
                                <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-black hover:bg-[#DC143C] transition-colors">
                                    <Plus className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Floating Cart Bar - Shows shared cart */}
            {sharedCart.items.length > 0 && (
                <div className="fixed bottom-6 left-4 right-4 z-50">
                    <div
                        className="bg-black text-white rounded-full py-4 px-6 flex items-center justify-between shadow-[4px_4px_0px_0px_#DC143C] border-2 border-black cursor-pointer active:translate-y-[2px] active:shadow-none transition-all"
                        onClick={() => setIsCartOpen(true)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-[#DC143C] text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white">
                                {sharedCart.getItemCount()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Table Order</span>
                                <span className="font-black text-xl">${sharedCart.getTotal().toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 font-black uppercase tracking-wider text-sm">
                            View Cart
                            <ChevronLeft className="w-5 h-5 rotate-180" />
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Drawer */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsCartOpen(false)}>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white p-4 border-b-2 flex items-center justify-between">
                            <h2 className="text-xl font-black">Table Order</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2">
                                <ChevronLeft className="w-6 h-6 rotate-90" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            {sharedCart.items.map(item => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                                >
                                    <div
                                        className="w-2 h-12 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.guestColor }}
                                    />
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                        {item.product?.imageUrl && (
                                            <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate">{item.product?.name?.en}</div>
                                        <div className="text-sm text-gray-500">by {item.guestName}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">${((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                                        {sharedCart.canRemoveItem(item) && (
                                            <button
                                                onClick={() => sharedCart.removeItem(item.id)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="sticky bottom-0 bg-white p-4 border-t-2">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-black text-2xl text-[#DC143C]">${sharedCart.getTotal().toFixed(2)}</span>
                            </div>
                            <p className="text-sm text-gray-500 text-center">
                                Manager will verify and send to kitchen
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Request Modal */}
            <PaymentRequestModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                tableNumber={parseInt(tableNumber || '0')}
                items={sharedCart.items}
                total={sharedCart.getTotal()}
                guestId={sharedCart.guestId}
            />

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
