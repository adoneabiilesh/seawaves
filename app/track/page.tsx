'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, ChefHat, Check, Package, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    notes?: string;
    Product: {
        name: { en: string };
        imageUrl?: string;
    };
}

interface TrackedOrder {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    tableNumber?: number;
    customerName?: string;
    elapsedMinutes: number;
    estimatedMinutes: number;
    statusMessage: string;
    progress: number;
    OrderItem: OrderItem[];
}

const statusSteps = [
    { key: 'pending', label: 'Order Received', icon: Package },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: Check },
    { key: 'delivered', label: 'Delivered', icon: Check },
];

export default function OrderTrackingPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const [order, setOrder] = useState<TrackedOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = async () => {
        if (!orderId) {
            setError('No order ID provided');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/orders/track?orderId=${orderId}`);
            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                setOrder(data.order);
                setError(null);

                // Show toast on status change
                if (order && order.status !== data.order.status) {
                    toast.success(data.order.statusMessage);
                }
            }
        } catch (err) {
            setError('Failed to fetch order');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchOrder();
        // Poll every 10 seconds for updates
        const interval = setInterval(fetchOrder, 10000);
        return () => clearInterval(interval);
    }, [orderId]);

    const getCurrentStepIndex = () => {
        if (!order) return 0;
        const idx = statusSteps.findIndex(s => s.key === order.status);
        return idx >= 0 ? idx : 0;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DC143C] border-t-transparent" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
                <p className="text-gray-600 mb-4">{error || 'Unable to find this order'}</p>
                <Link href="/menu" className="text-[#DC143C] font-bold hover:underline">
                    ← Back to Menu
                </Link>
            </div>
        );
    }

    const currentStep = getCurrentStepIndex();

    return (
        <div className="min-h-screen bg-[#FAF8F5]">
            {/* Header */}
            <div className="bg-white border-b-4 border-black sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/menu" className="text-gray-600 hover:text-black">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-black uppercase">Order Tracking</h1>
                    <button onClick={fetchOrder} className="text-gray-600 hover:text-black">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Order ID Badge */}
                <div className="text-center mb-8">
                    <span className="inline-block bg-black text-white px-4 py-2 rounded-full text-sm font-bold">
                        Order #{order.id.slice(-8).toUpperCase()}
                    </span>
                </div>

                {/* Status Message */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">{order.statusMessage}</h2>
                    {order.estimatedMinutes > 0 && (
                        <p className="text-gray-600 flex items-center justify-center gap-2">
                            <Clock className="w-5 h-5" />
                            Estimated: {order.estimatedMinutes} min
                        </p>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="bg-white rounded-2xl border-2 border-black p-6 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 mx-8" />
                        <div
                            className="absolute top-6 left-0 h-1 bg-[#DC143C] mx-8 transition-all duration-500"
                            style={{ width: `${Math.min(100, (currentStep / (statusSteps.length - 1)) * 100)}%` }}
                        />

                        {/* Steps */}
                        <div className="relative flex justify-between">
                            {statusSteps.map((step, index) => {
                                const isCompleted = index <= currentStep;
                                const isCurrent = index === currentStep;
                                const Icon = step.icon;

                                return (
                                    <div key={step.key} className="flex flex-col items-center">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted
                                                    ? 'bg-[#DC143C] border-[#DC143C] text-white'
                                                    : 'bg-white border-gray-300 text-gray-400'
                                                } ${isCurrent ? 'ring-4 ring-[#DC143C]/20' : ''}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs mt-2 font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-lg mb-4">Your Order</h3>
                    <div className="space-y-4">
                        {order.OrderItem?.map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                                {item.Product?.imageUrl && (
                                    <img
                                        src={item.Product.imageUrl}
                                        alt=""
                                        className="w-16 h-16 rounded-xl object-cover"
                                    />
                                )}
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900">
                                        {typeof item.Product?.name === 'object' ? item.Product.name.en : item.Product?.name}
                                    </p>
                                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                    {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                                </div>
                                <p className="font-bold">${item.price.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-dashed border-gray-200 mt-6 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-black">Total</span>
                            <span className="text-2xl font-black text-[#DC143C]">${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Table Info */}
                {order.tableNumber && (
                    <div className="mt-4 text-center text-gray-600">
                        Table {order.tableNumber}
                    </div>
                )}
            </div>
        </div>
    );
}
