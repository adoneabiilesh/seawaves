'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/db';
import { Product, Addon, ProductVariant } from '@/types';

// Guest colors for visual distinction
const GUEST_COLORS = [
    '#DC143C', // Crimson
    '#4169E1', // Royal Blue
    '#32CD32', // Lime Green
    '#FF8C00', // Dark Orange
    '#9932CC', // Dark Orchid
    '#20B2AA', // Light Sea Green
    '#FF69B4', // Hot Pink
    '#FFD700', // Gold
];

export interface SharedCartItem {
    id: string;
    tableSessionId: string;
    productId: string;
    guestId: string;
    guestName: string;
    guestColor: string;
    quantity: number;
    notes?: string;
    addons: Addon[];
    selectedVariant?: ProductVariant;
    status: 'pending' | 'verified' | 'sent_to_kitchen' | 'cancelled';
    verifiedBy?: string;
    verifiedAt?: string;
    createdAt: string;
    updatedAt: string;
    // Joined data
    product?: Product;
}

interface UseSharedCartOptions {
    tableSessionId: string;
    guestName?: string;
}

interface UseSharedCartReturn {
    items: SharedCartItem[];
    guestId: string;
    guestName: string;
    guestColor: string;
    isLoading: boolean;
    error: string | null;
    addItem: (product: Product, quantity: number, options?: { notes?: string; addons?: Addon[]; variant?: ProductVariant }) => Promise<void>;
    updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<boolean>;
    getTotal: () => number;
    getItemCount: () => number;
    getMyItems: () => SharedCartItem[];
    canRemoveItem: (item: SharedCartItem) => boolean;
    setGuestName: (name: string) => void;
}

export function useSharedCart({ tableSessionId, guestName: initialGuestName }: UseSharedCartOptions): UseSharedCartReturn {
    const [items, setItems] = useState<SharedCartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [guestId] = useState(() => {
        // Generate or retrieve guest ID from localStorage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(`guest_id_${tableSessionId}`);
            if (stored) return stored;
            const newId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(`guest_id_${tableSessionId}`, newId);
            return newId;
        }
        return `guest_${Date.now()}`;
    });

    const [guestName, setGuestNameState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`guest_name_${tableSessionId}`) || initialGuestName || 'Guest';
        }
        return initialGuestName || 'Guest';
    });

    const [guestColor] = useState(() => {
        // Assign a consistent color based on guestId hash
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(`guest_color_${tableSessionId}`);
            if (stored) return stored;
            const colorIndex = Math.abs(guestId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % GUEST_COLORS.length;
            const color = GUEST_COLORS[colorIndex];
            localStorage.setItem(`guest_color_${tableSessionId}`, color);
            return color;
        }
        return GUEST_COLORS[0];
    });

    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Set guest name and persist
    const setGuestName = useCallback((name: string) => {
        setGuestNameState(name);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`guest_name_${tableSessionId}`, name);
        }
    }, [tableSessionId]);

    // Fetch initial cart items
    const fetchItems = useCallback(async () => {
        // Don't fetch if no session ID
        if (!tableSessionId) {
            setIsLoading(false);
            return;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('SharedCartItem')
                .select(`
                    *,
                    product:Product(*)
                `)
                .eq('tableSessionId', tableSessionId)
                .neq('status', 'cancelled')
                .order('createdAt', { ascending: true });

            if (fetchError) throw fetchError;
            setItems(data || []);
        } catch (err: any) {
            console.error('Failed to fetch shared cart:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [tableSessionId]);

    // Subscribe to realtime changes
    useEffect(() => {
        // Don't subscribe if no session ID
        if (!tableSessionId) return;

        fetchItems();

        // Set up realtime subscription
        channelRef.current = supabase
            .channel(`shared_cart_${tableSessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'SharedCartItem',
                    filter: `tableSessionId=eq.${tableSessionId}`
                },
                async (payload) => {
                    console.log('Realtime update:', payload);

                    if (payload.eventType === 'INSERT') {
                        // Fetch full item with product data
                        const { data } = await supabase
                            .from('SharedCartItem')
                            .select('*, product:Product(*)')
                            .eq('id', payload.new.id)
                            .single();
                        if (data) {
                            setItems(prev => [...prev, data]);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setItems(prev => prev.map(item =>
                            item.id === payload.new.id
                                ? { ...item, ...payload.new }
                                : item
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        setItems(prev => prev.filter(item => item.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [tableSessionId, fetchItems]);

    // Add item to shared cart
    const addItem = useCallback(async (
        product: Product,
        quantity: number,
        options?: { notes?: string; addons?: Addon[]; variant?: ProductVariant }
    ) => {
        try {
            const { error: insertError } = await supabase
                .from('SharedCartItem')
                .insert({
                    tableSessionId,
                    productId: product.id,
                    guestId,
                    guestName,
                    guestColor,
                    quantity,
                    notes: options?.notes,
                    addons: options?.addons || [],
                    selectedVariant: options?.variant,
                    status: 'pending'
                });

            if (insertError) throw insertError;
        } catch (err: any) {
            console.error('Failed to add item:', err);
            setError(err.message);
            throw err;
        }
    }, [tableSessionId, guestId, guestName, guestColor]);

    // Update item quantity
    const updateItemQuantity = useCallback(async (itemId: string, quantity: number) => {
        try {
            if (quantity <= 0) {
                await supabase.from('SharedCartItem').delete().eq('id', itemId);
            } else {
                await supabase
                    .from('SharedCartItem')
                    .update({ quantity })
                    .eq('id', itemId);
            }
        } catch (err: any) {
            console.error('Failed to update item:', err);
            setError(err.message);
            throw err;
        }
    }, []);

    // Remove item (only own items)
    const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
        const item = items.find(i => i.id === itemId);
        if (!item) return false;

        // Only allow removing own items
        if (item.guestId !== guestId) {
            setError('You can only remove your own items');
            return false;
        }

        try {
            await supabase.from('SharedCartItem').delete().eq('id', itemId);
            return true;
        } catch (err: any) {
            console.error('Failed to remove item:', err);
            setError(err.message);
            return false;
        }
    }, [items, guestId]);

    // Calculate total
    const getTotal = useCallback(() => {
        return items
            .filter(i => i.status !== 'cancelled')
            .reduce((sum, item) => {
                const basePrice = item.product?.price || 0;
                const variantPrice = item.selectedVariant?.priceModifier || 0;
                const addonsPrice = item.addons?.reduce((a, addon) => a + addon.price, 0) || 0;
                return sum + ((basePrice + variantPrice + addonsPrice) * item.quantity);
            }, 0);
    }, [items]);

    // Get item count
    const getItemCount = useCallback(() => {
        return items
            .filter(i => i.status !== 'cancelled')
            .reduce((sum, item) => sum + item.quantity, 0);
    }, [items]);

    // Get my items only
    const getMyItems = useCallback(() => {
        return items.filter(i => i.guestId === guestId && i.status !== 'cancelled');
    }, [items, guestId]);

    // Check if user can remove an item
    const canRemoveItem = useCallback((item: SharedCartItem) => {
        return item.guestId === guestId;
    }, [guestId]);

    return {
        items,
        guestId,
        guestName,
        guestColor,
        isLoading,
        error,
        addItem,
        updateItemQuantity,
        removeItem,
        getTotal,
        getItemCount,
        getMyItems,
        canRemoveItem,
        setGuestName
    };
}
