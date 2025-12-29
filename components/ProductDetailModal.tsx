'use client';

import React, { useState } from 'react';
import { Product, Addon, CartItem } from '@/types';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, X, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ProductDetailModalProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (item: CartItem) => void;
    addons?: Addon[];
}

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart, addons = [] }: ProductDetailModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    // Helper to get addon display name (handles JSONB)
    const getAddonName = (addon: Addon): string => {
        if (typeof addon.name === 'string') return addon.name;
        if (typeof addon.name === 'object' && addon.name?.en) return addon.name.en;
        return String(addon.name);
    };

    // Use real addons from database or fallback to defaults for demo
    const currentAddons = addons.length > 0 ? addons.map(a => ({
        ...a,
        category: a.category || 'additives',
        displayName: getAddonName(a)
    })) : [
        { id: 'a1', name: { en: 'Onion' }, price: 0, category: 'additives', displayName: 'Onion', available: true },
        { id: 'a2', name: { en: 'Pepper' }, price: 1, category: 'additives', displayName: 'Pepper', available: true },
        { id: 'a3', name: { en: 'Greenery' }, price: 2, category: 'additives', displayName: 'Greenery', available: true },
        { id: 'a4', name: { en: 'Sesame' }, price: 1, category: 'additives', displayName: 'Sesame', available: true },
        { id: 'b1', name: { en: 'Coke' }, price: 2, category: 'beverages', displayName: 'Coke', available: true },
        { id: 'b2', name: { en: 'Water' }, price: 1, category: 'beverages', displayName: 'Water', available: true },
    ];

    const addonTotal = selectedAddons.reduce((sum, id) => {
        const addon = currentAddons.find(a => a.id === id);
        return sum + (addon?.price || 0);
    }, 0);

    const totalPrice = (product.price + addonTotal) * quantity;

    const handleAddToCart = () => {
        onAddToCart({
            product,
            quantity,
            notes,
            addons: currentAddons.filter(a => selectedAddons.includes(a.id)) as any
        });
        onClose();
    };

    const toggleAddon = (id: string) => {
        if (selectedAddons.includes(id)) {
            setSelectedAddons(prev => prev.filter(x => x !== id));
        } else {
            setSelectedAddons(prev => [...prev, id]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden bg-[#FFFFF0] text-black border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl" aria-describedby={undefined}>
                <DialogTitle className="sr-only">{product.name.en}</DialogTitle>
                <div className="flex flex-col md:flex-row h-[90vh] md:h-auto">

                    {/* LEFT SIDE: Image + Nutrition */}
                    <div className="w-full md:w-[45%] bg-[#F2F0E6] p-6 flex flex-col justify-between relative border-b-2 md:border-b-0 md:border-r-2 border-black">
                        <Button variant="ghost" size="icon" className="absolute top-4 left-4 md:hidden" onClick={onClose}>
                            <X className="w-6 h-6 text-black" />
                        </Button>

                        <div className="flex-1 flex items-center justify-center p-4">
                            <div className="relative aspect-square w-full max-w-[350px] rounded-full overflow-hidden border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                                <img
                                    src={product.imageUrl || "/placeholder.png"}
                                    alt={product.name.en}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Nutrition Grid */}
                        <div className="grid grid-cols-4 gap-0 border-t-2 border-black">
                            <div className="p-4 border-r-2 border-black text-center">
                                <div className="text-[10px] uppercase font-black tracking-wider text-black/60">Proteins</div>
                                <div className="text-xl font-black text-[#DC143C] mt-1">{product.nutrition?.protein || 0}g</div>
                            </div>
                            <div className="p-4 border-r-2 border-black text-center">
                                <div className="text-[10px] uppercase font-black tracking-wider text-black/60">Fat</div>
                                <div className="text-xl font-black text-[#DC143C] mt-1">{product.nutrition?.fat || 0}g</div>
                            </div>
                            <div className="p-4 border-r-2 border-black text-center">
                                <div className="text-[10px] uppercase font-black tracking-wider text-black/60">Carbs</div>
                                <div className="text-xl font-black text-[#DC143C] mt-1">{product.nutrition?.carbs || 0}g</div>
                            </div>
                            <div className="p-4 text-center">
                                <div className="text-[10px] uppercase font-black tracking-wider text-black/60">Calories</div>
                                <div className="text-xl font-black text-[#DC143C] mt-1">{product.nutrition?.calories || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Details + Controls */}
                    <div className="w-full md:w-[55%] p-6 md:p-8 flex flex-col h-full overflow-y-auto bg-[#FFFFF0]">
                        <div className="flex justify-between items-start">
                            <h2 className="text-3xl md:text-4xl font-black text-black uppercase leading-none mb-2">
                                {product.name.en}
                            </h2>
                            <Button variant="ghost" size="icon" className="hidden md:flex -mr-4 -mt-4 hover:bg-transparent" onClick={onClose}>
                                <X className="h-8 w-8 border-2 border-black rounded-full p-1 hover:bg-[#DC143C] hover:text-white transition-colors" />
                            </Button>
                        </div>

                        <div className="prose prose-sm mt-4 text-black/80 font-medium leading-relaxed">
                            {product.description.en}
                        </div>

                        {/* Allergens & Ingredients */}
                        <div className="mt-6 flex flex-col gap-4 text-sm">
                            {product.allergens && product.allergens.length > 0 && (
                                <div>
                                    <span className="font-black uppercase text-[#DC143C] tracking-wider text-xs block mb-2">Allergens</span>
                                    <div className="flex flex-wrap gap-2">
                                        {product.allergens.map(a => (
                                            <span key={a} className="bg-white text-[#DC143C] px-3 py-1 rounded-full text-xs font-bold border-2 border-[#DC143C]">{a}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {product.ingredients && product.ingredients.length > 0 && (
                                <div>
                                    <span className="font-black uppercase text-black/60 tracking-wider text-xs block mb-1">Ingredients</span>
                                    <p className="text-black font-medium leading-relaxed">{product.ingredients.join(', ')}</p>
                                </div>
                            )}

                            {product.pairings && (product.pairings.drinks?.length > 0 || product.pairings.foods?.length > 0) && (
                                <div className="space-y-3">
                                    {product.pairings.drinks && product.pairings.drinks.length > 0 && (
                                        <div>
                                            <span className="font-black uppercase text-purple-600 tracking-wider text-xs block mb-1">🍷 Pairs Well With</span>
                                            <div className="flex flex-wrap gap-2">
                                                {product.pairings.drinks.map((drink, i) => (
                                                    <span key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">{drink}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {product.pairings.foods && product.pairings.foods.length > 0 && (
                                        <div>
                                            <span className="font-black uppercase text-green-600 tracking-wider text-xs block mb-1">🍴 Try With</span>
                                            <div className="flex flex-wrap gap-2">
                                                {product.pairings.foods.map((food, i) => (
                                                    <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">{food}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="my-6 text-black/50 text-sm font-bold uppercase tracking-widest">
                            Approx weight: {product.weight || '450g'}
                        </div>

                        {/* Add to Cart Bar */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-center border-2 border-black rounded-full h-14 px-4 bg-white">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full"><Minus className="w-4 h-4" /></button>
                                <span className="mx-4 font-black text-xl w-4 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full"><Plus className="w-4 h-4" /></button>
                            </div>

                            <Button
                                className="flex-1 bg-[#DC143C] hover:bg-black text-white rounded-full h-14 text-sm font-black tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                onClick={handleAddToCart}
                            >
                                ADD · ${(totalPrice).toFixed(2)}
                            </Button>
                        </div>

                        {/* Addons Tabs */}
                        <div className="border-2 border-black rounded-xl overflow-hidden flex-1 flex flex-col">
                            <Tabs defaultValue="additives" className="w-full flex-1 flex flex-col">
                                <TabsList className="w-full justify-start rounded-none bg-black p-0 h-12">
                                    <TabsTrigger value="additives" className="flex-1 rounded-none data-[state=active]:bg-[#FFFFF0] data-[state=active]:text-black text-white font-bold uppercase tracking-wide border-r border-white/20 h-full">Additives</TabsTrigger>
                                    <TabsTrigger value="beverages" className="flex-1 rounded-none data-[state=active]:bg-[#FFFFF0] data-[state=active]:text-black text-white font-bold uppercase tracking-wide border-r border-white/20 h-full">Drinks</TabsTrigger>
                                    <TabsTrigger value="notes" className="flex-1 rounded-none data-[state=active]:bg-[#FFFFF0] data-[state=active]:text-black text-white font-bold uppercase tracking-wide h-full">Notes</TabsTrigger>
                                </TabsList>

                                <div className="flex-1 bg-[#FFFFF0] p-4 overflow-y-auto">
                                    <TabsContent value="additives" className="mt-0">
                                        <div className="grid grid-cols-2 gap-4">
                                            {currentAddons.filter(a => a.category === 'additives').map(addon => (
                                                <div key={addon.id} className="flex items-center justify-between p-2 rounded-lg border-2 border-transparent hover:border-black/10 transition-colors cursor-pointer" onClick={() => toggleAddon(addon.id)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-6 h-6 rounded border-2 border-black flex items-center justify-center transition-colors",
                                                            selectedAddons.includes(addon.id) ? "bg-[#DC143C] border-[#DC143C]" : "bg-white"
                                                        )}>
                                                            {selectedAddons.includes(addon.id) && <Check className="text-white h-4 w-4" />}
                                                        </div>
                                                        <span className="text-sm font-bold">{addon.displayName}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-[#DC143C]">
                                                        {addon.price > 0 ? `+$${addon.price}` : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="beverages" className="mt-0">
                                        <div className="grid grid-cols-2 gap-4">
                                            {currentAddons.filter(a => a.category === 'beverages').map(addon => (
                                                <div key={addon.id} className="flex items-center justify-between p-2 rounded-lg border-2 border-transparent hover:border-black/10 transition-colors cursor-pointer" onClick={() => toggleAddon(addon.id)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-6 h-6 rounded border-2 border-black flex items-center justify-center transition-colors",
                                                            selectedAddons.includes(addon.id) ? "bg-[#DC143C] border-[#DC143C]" : "bg-white"
                                                        )}>
                                                            {selectedAddons.includes(addon.id) && <Check className="text-white h-4 w-4" />}
                                                        </div>
                                                        <span className="text-sm font-bold">{addon.displayName}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-[#DC143C]">
                                                        {addon.price > 0 ? `+$${addon.price}` : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="notes" className="mt-0">
                                        <Textarea
                                            placeholder="Any allergies or special requests? (e.g. No onions, extra spicy)"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            className="bg-white border-2 border-black min-h-[100px] rounded-xl font-medium focus-visible:ring-0 placeholder:font-bold placeholder:text-black/30"
                                        />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
