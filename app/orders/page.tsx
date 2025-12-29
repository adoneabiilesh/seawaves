'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ChevronRight, Package, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '../providers';
import { supabase } from '@/lib/supabase-client';

interface HistoryOrder {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    tableNumber?: number;
    OrderItem: {
        id: string;
        quantity: number;
        Product: {
            name: { en: string };
        };
    }[];
}

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<HistoryOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useApp();

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            // Get customer email from localStorage or user
            const customerEmail = user?.email || localStorage.getItem('guestEmail');

            if (!customerEmail) {
                setOrders([]);
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('Order')
                .select(`
          id,
          status,
          total,
          createdAt,
          tableNumber,
          OrderItem (
            id,
            quantity,
            Product (name)
          )
        `)
                .eq('customerEmail', customerEmail)
                .order('createdAt', { ascending: false })
                .limit(20);

            if (!error && data) {
                setOrders(data as any);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'preparing': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-green-100 text-green-800';
            case 'delivered': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-[#FAF8F5]">
            {/* Header */}
            <div className="bg-white border-b-4 border-black sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/menu" className="text-gray-600 hover:text-black">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-black uppercase">Order History</h1>
                    <button onClick={fetchOrders} className="text-gray-600 hover:text-black">
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#DC143C] border-t-transparent" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
                        <p className="text-gray-600 mb-6">Your order history will appear here</p>
                        <Link
                            href="/menu"
                            className="inline-block bg-[#DC143C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#DC143C]/90 transition-colors"
                        >
                            Browse Menu
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Link
                                key={order.id}
                                href={`/track?id=${order.id}`}
                                className="block bg-white rounded-2xl border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-600 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {formatDate(order.createdAt)}
                                    </span>
                                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {order.OrderItem?.length || 0} items
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Order #{order.id.slice(-6).toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black text-[#DC143C]">
                                            ${order.total.toFixed(2)}
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
