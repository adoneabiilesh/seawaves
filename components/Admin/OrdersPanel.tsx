'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/db';
import { Order, Product } from '@/types';
import {
    Bell,
    UtensilsCrossed,
    Truck,
    ShoppingBag,
    Clock,
    CheckCircle2,
    ChefHat,
    Package,
    Volume2,
    VolumeX,
    Loader2,
    Edit3,
    X,
    Plus,
    Minus,
    Trash2,
    Phone,
    Mail,
    CreditCard,
    MapPin,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    Product?: {
        id: string;
        name: { en: string };
        price: number;
    };
}

interface OrderWithItems extends Order {
    OrderItem?: OrderItem[];
    orderType?: string;
    customerEmail?: string;
    customerPhone?: string;
    deliveryAddress?: string;
}

interface OrdersPanelProps {
    restaurantId: string;
}

export const OrdersPanel: React.FC<OrdersPanelProps> = ({ restaurantId }) => {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'dine_in' | 'delivery' | 'takeout'>('all');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Edit modal state
    const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);
    const [editItems, setEditItems] = useState<OrderItem[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    // Fetch orders on mount
    useEffect(() => {
        fetchOrders();
        fetchProducts();

        // Set up real-time subscription
        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Order',
                    filter: `restaurantId=eq.${restaurantId}`
                },
                (payload: any) => {
                    console.log('New order received:', payload);
                    handleNewOrder(payload.new as OrderWithItems);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'Order',
                    filter: `restaurantId=eq.${restaurantId}`
                },
                (payload: any) => {
                    handleOrderUpdate(payload.new as OrderWithItems);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('Product')
            .select('*')
            .eq('restaurantId', restaurantId)
            .eq('available', true);
        if (data) setAvailableProducts(data);
    };

    const fetchOrders = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('Order')
            .select(`
                *,
                OrderItem (
                    id,
                    productId,
                    quantity,
                    price,
                    Product (
                        id,
                        name,
                        price
                    )
                )
            `)
            .eq('restaurantId', restaurantId)
            .order('createdAt', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);
        }
        setIsLoading(false);
    };

    const handleNewOrder = (newOrder: OrderWithItems) => {
        setOrders(prev => [newOrder, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Play notification sound
        if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(console.error);
        }

        // Vibrate if supported
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }

        // Show desktop notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('New Order!', {
                body: `Order #${newOrder.id.slice(-6)} - ${newOrder.customerName || 'Guest'}`,
                icon: '/icon.png',
                tag: 'new-order'
            });
        }
    };

    const handleOrderUpdate = (updatedOrder: OrderWithItems) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from('Order')
            .update({ status: newStatus, updatedAt: new Date().toISOString() })
            .eq('id', orderId);

        if (error) {
            console.error('Error updating order:', error);
        } else {
            fetchOrders(); // Refresh
        }
    };

    // Request notification permission
    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // --- ORDER EDITING ---
    const openEditModal = (order: OrderWithItems) => {
        setEditingOrder(order);
        setEditItems(order.OrderItem ? [...order.OrderItem] : []);
    };

    const closeEditModal = () => {
        setEditingOrder(null);
        setEditItems([]);
    };

    const updateItemQuantity = (itemId: string, delta: number) => {
        setEditItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (itemId: string) => {
        setEditItems(prev => prev.filter(item => item.id !== itemId));
    };

    const addItemToOrder = (product: Product) => {
        // Check if product already in order
        const existing = editItems.find(item => item.productId === product.id);
        if (existing) {
            updateItemQuantity(existing.id, 1);
        } else {
            // Add new item with temp ID
            setEditItems(prev => [...prev, {
                id: `new-${Date.now()}`,
                productId: product.id,
                quantity: 1,
                price: product.price,
                Product: {
                    id: product.id,
                    name: product.name as { en: string },
                    price: product.price
                }
            }]);
        }
    };

    const saveOrderEdits = async () => {
        if (!editingOrder) return;
        setIsUpdating(true);

        try {
            // Calculate new total
            const newTotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Delete existing order items
            await supabase.from('OrderItem').delete().eq('orderId', editingOrder.id);

            // Insert updated items
            const itemsToInsert = editItems.map(item => ({
                orderId: editingOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            }));

            if (itemsToInsert.length > 0) {
                await supabase.from('OrderItem').insert(itemsToInsert);
            }

            // Update order total
            await supabase
                .from('Order')
                .update({ total: newTotal, updatedAt: new Date().toISOString() })
                .eq('id', editingOrder.id);

            alert('Order updated successfully!');
            closeEditModal();
            fetchOrders();
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order');
        }

        setIsUpdating(false);
    };

    // --- FILTERS ---
    const filteredOrders = orders.filter(order => {
        if (activeTab === 'all') return true;
        const orderType = order.orderType || 'dine_in';
        return orderType === activeTab;
    });

    // --- HELPERS ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'ready': return 'bg-green-100 text-green-800 border-green-300';
            case 'delivered': return 'bg-gray-100 text-gray-600 border-gray-300';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-600 border-gray-300';
        }
    };

    const getOrderTypeIcon = (orderType?: string) => {
        switch (orderType) {
            case 'delivery': return <Truck className="w-3 h-3" />;
            case 'takeout': return <ShoppingBag className="w-3 h-3" />;
            default: return <UtensilsCrossed className="w-3 h-3" />;
        }
    };

    const getOrderTypeBadge = (orderType?: string) => {
        const type = orderType || 'dine_in';
        const colors: Record<string, string> = {
            'dine_in': 'bg-purple-100 text-purple-700',
            'delivery': 'bg-orange-100 text-orange-700',
            'takeout': 'bg-cyan-100 text-cyan-700'
        };
        return colors[type] || colors['dine_in'];
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'preparing': return <ChefHat className="w-4 h-4" />;
            case 'ready': return <Package className="w-4 h-4" />;
            case 'delivered': return <CheckCircle2 className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getNextStatus = (currentStatus: string): string | null => {
        switch (currentStatus) {
            case 'pending': return 'preparing';
            case 'preparing': return 'ready';
            case 'ready': return 'delivered';
            default: return null;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getTimeElapsed = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const mins = Math.floor((now.getTime() - date.getTime()) / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ${mins % 60}m ago`;
    };

    return (
        <div className="space-y-6">
            {/* Hidden audio element for notification sound */}
            <audio ref={audioRef} src="/notification.mp3" preload="auto" />

            {/* Header with sound toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black uppercase tracking-wider">Live Orders</h2>
                    {unreadCount > 0 && (
                        <span className="bg-[#DC143C] text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchOrders}
                        className="p-3 rounded-full border-2 border-black bg-white hover:bg-gray-50 transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={cn(
                            "p-3 rounded-full border-2 border-black transition-all",
                            soundEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}
                    >
                        {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-[#F2F0E6] p-1 rounded-xl border-2 border-black">
                {[
                    { id: 'all', label: 'All', icon: Bell },
                    { id: 'dine_in', label: 'Dine-in', icon: UtensilsCrossed },
                    { id: 'takeout', label: 'Takeout', icon: ShoppingBag },
                    { id: 'delivery', label: 'Delivery', icon: Truck },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); setUnreadCount(0); }}
                        className={cn(
                            "flex-1 py-3 px-4 rounded-lg font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all",
                            activeTab === tab.id
                                ? "bg-black text-white shadow-sm"
                                : "text-black hover:bg-black/5"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No orders yet</p>
                    <p className="text-sm">New orders will appear here in real-time</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOrders.map(order => (
                        <div
                            key={order.id}
                            className={cn(
                                "bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
                                order.status === 'pending' && "animate-pulse border-[#DC143C]"
                            )}
                        >
                            {/* Order Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-lg">#{order.id.slice(-6).toUpperCase()}</p>
                                        <span className={cn("px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1", getOrderTypeBadge(order.orderType))}>
                                            {getOrderTypeIcon(order.orderType)}
                                            {order.orderType || 'dine-in'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>{formatTime(order.createdAt || new Date().toISOString())}</span>
                                        <span className="text-orange-600 font-bold">{getTimeElapsed(order.createdAt || new Date().toISOString())}</span>
                                    </div>
                                </div>
                                <span className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1", getStatusColor(order.status))}>
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                </span>
                            </div>

                            {/* Customer Info - Enhanced */}
                            <div className="mb-3 pb-3 border-b border-gray-200">
                                <p className="font-bold">{order.customerName || 'Guest'}</p>
                                {order.tableNumber && (
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <UtensilsCrossed className="w-3 h-3" /> Table {order.tableNumber}
                                    </p>
                                )}
                                {(order as any).customerEmail && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {(order as any).customerEmail}
                                    </p>
                                )}
                                {(order as any).customerPhone && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {(order as any).customerPhone}
                                    </p>
                                )}
                                {(order as any).deliveryAddress && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {(order as any).deliveryAddress}
                                    </p>
                                )}
                                {order.paymentMode && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <CreditCard className="w-3 h-3" /> {order.paymentMode.replace('_', ' ')}
                                    </p>
                                )}
                            </div>

                            {/* Order Items */}
                            <div className="space-y-1 mb-3">
                                {order.OrderItem?.slice(0, 4).map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.Product?.name?.en || 'Item'}</span>
                                        <span className="text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                {(order.OrderItem?.length || 0) > 4 && (
                                    <p className="text-xs text-gray-400">+{(order.OrderItem?.length || 0) - 4} more items</p>
                                )}
                                {!order.OrderItem?.length && <p className="text-sm text-gray-400">No items</p>}
                            </div>

                            {/* Special Requests */}
                            {order.specialRequests && (
                                <div className="mb-3 p-2 bg-yellow-50 rounded-lg text-sm italic text-yellow-800 border border-yellow-200">
                                    "{order.specialRequests}"
                                </div>
                            )}

                            {/* Total & Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                <p className="font-black text-lg">${(order.total || 0).toFixed(2)}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(order)}
                                        className="p-2 rounded-lg border-2 border-black hover:bg-gray-50 transition-colors"
                                        title="Edit Order"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    {getNextStatus(order.status) && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                                            className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-[#DC143C] transition-colors"
                                        >
                                            {getNextStatus(order.status)}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Order Modal */}
            {editingOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border-2 border-black rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b-2 border-black">
                            <h3 className="text-xl font-black uppercase">Edit Order #{editingOrder.id.slice(-6).toUpperCase()}</h3>
                            <button onClick={closeEditModal} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {/* Current Items */}
                            <div className="mb-6">
                                <h4 className="font-bold text-sm uppercase text-gray-500 mb-3">Current Items</h4>
                                {editItems.length === 0 ? (
                                    <p className="text-gray-400 text-sm">No items in order</p>
                                ) : (
                                    <div className="space-y-2">
                                        {editItems.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                <div>
                                                    <p className="font-bold">{item.Product?.name?.en || 'Item'}</p>
                                                    <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 border-2 border-black rounded-lg">
                                                        <button
                                                            onClick={() => updateItemQuantity(item.id, -1)}
                                                            className="p-2 hover:bg-gray-100"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="font-bold w-8 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateItemQuantity(item.id, 1)}
                                                            className="p-2 hover:bg-gray-100"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add Items */}
                            <div>
                                <h4 className="font-bold text-sm uppercase text-gray-500 mb-3">Add Items</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {availableProducts.slice(0, 12).map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => addItemToOrder(product)}
                                            className="p-3 text-left bg-white border-2 border-gray-200 rounded-lg hover:border-black transition-colors"
                                        >
                                            <p className="font-bold text-sm truncate">{typeof product.name === 'object' ? product.name.en : product.name}</p>
                                            <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between p-4 border-t-2 border-black bg-gray-50">
                            <div>
                                <p className="text-sm text-gray-500">New Total</p>
                                <p className="text-2xl font-black">
                                    ${editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
                                <Button
                                    onClick={saveOrderEdits}
                                    disabled={isUpdating}
                                    className="bg-[#DC143C] hover:bg-[#DC143C]/90"
                                >
                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
