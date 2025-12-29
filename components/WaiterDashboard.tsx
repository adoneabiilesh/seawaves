'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../app/providers';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Clock, CheckCircle, Plus, AlertCircle, ChefHat, Info } from 'lucide-react';
import { Button } from './ui/button';
import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

export const WaiterDashboard = () => {
    const { orders, user, setOrders, products } = useApp();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setLoading(false), 500);
    }, []);

    const activeOrders = (orders || []).filter(o =>
        o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING || o.status === OrderStatus.READY
    );

    const handleMarkServed = (orderId: string) => {
        setOrders(prev => Array.isArray(prev) ? prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.DELIVERED } : o) : []);
    };

    const getProductAllergens = (productName: string) => {
        const prod = products.find(p => p.name.en === productName || (typeof p.name === 'string' && p.name === productName));
        return prod?.allergens || [];
    };

    return (
        <div className="min-h-screen bg-[#FFFFF0] p-4 sm:p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="border-b-4 border-black pb-4 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Waiter Station</h1>
                        <p className="font-bold text-black/60 uppercase text-xs tracking-widest mt-1">Level 2 Access • Serving Active Tables</p>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                        <div className="text-xs font-black uppercase text-black/40 mb-1">Active Tables</div>
                        <div className="text-3xl font-black">{new Set(activeOrders.map(o => o.tableNumber)).size}</div>
                    </div>
                    <div className="bg-[#DC143C] text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                        <div className="text-xs font-black uppercase text-white/60 mb-1">Pickups Ready</div>
                        <div className="text-3xl font-black">{activeOrders.filter(o => o.status === OrderStatus.READY).length}</div>
                    </div>
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeOrders.length === 0 ? (
                        <Card className="col-span-full border-4 border-dashed border-black/20 bg-transparent">
                            <CardContent className="p-12 text-center">
                                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-black/10" />
                                <p className="font-black text-black/20 uppercase text-xl">All tables clear</p>
                            </CardContent>
                        </Card>
                    ) : (
                        activeOrders.map((order) => (
                            <Card key={order.id} className={cn(
                                "border-4 border-black shadow-[8px_8px_0px_0px_black] transition-all relative overflow-hidden",
                                order.status === OrderStatus.READY ? "bg-white ring-4 ring-[#DC143C] ring-inset" : "bg-white"
                            )}>
                                {order.status === OrderStatus.READY && (
                                    <div className="bg-[#DC143C] text-white py-1 px-4 text-center font-black uppercase text-[10px] tracking-widest">
                                        Order Ready for Pickup
                                    </div>
                                )}

                                <CardHeader className="pb-3 border-b-4 border-black">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-3xl font-black uppercase">Table {order.tableNumber}</CardTitle>
                                        <div className="flex flex-col items-end">
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded font-black uppercase border-2 border-black",
                                                order.status === OrderStatus.PENDING ? "bg-yellow-400" :
                                                    order.status === OrderStatus.PREPARING ? "bg-blue-400" : "bg-green-400"
                                            )}>
                                                {order.status}
                                            </span>
                                            <div className="text-[10px] font-bold mt-1 uppercase text-black/40">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'N/A'}</div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-4 px-4">
                                    <div className="space-y-3">
                                        {order.items?.map((item: any, idx: number) => {
                                            const allergens = getProductAllergens(item.name);
                                            return (
                                                <div key={idx} className="border-b-2 border-black/5 pb-2 last:border-0">
                                                    <div className="flex justify-between items-start">
                                                        <div className="font-bold text-sm uppercase flex items-center gap-2">
                                                            <span className="bg-black text-white w-5 h-5 flex items-center justify-center text-[10px]">{item.quantity}</span>
                                                            {item.name}
                                                        </div>
                                                        <span className="font-black text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>

                                                    {/* Allergen Warning */}
                                                    {allergens.length > 0 && (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {allergens.map(a => (
                                                                <span key={a} className="text-[8px] bg-red-100 text-red-600 border border-red-200 px-1 font-black uppercase flex items-center gap-0.5">
                                                                    <AlertCircle size={8} /> {a}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {order.specialRequests && (
                                        <div className="mt-4 p-2 bg-[#FFFFF0] border-2 border-black text-[10px] font-bold uppercase italic leading-tight">
                                            <span className="text-[#DC143C] font-black mr-1">Note:</span> {order.specialRequests}
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="flex flex-col gap-2 p-4 pt-0">
                                    <div className="w-full flex justify-between items-center mb-2 px-1">
                                        <span className="text-xs font-bold uppercase text-black/40">Amount Due</span>
                                        <span className="text-xl font-black">${order.total.toFixed(2)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        <Button variant="outline" className="border-2 border-black font-black uppercase text-[10px] h-10 shadow-[2px_2px_0px_0px_black]" onClick={() => alert("Redirecting to Menu to add items...")}>
                                            <Plus size={14} className="mr-1" /> Add
                                        </Button>
                                        <Button
                                            disabled={order.status !== OrderStatus.READY}
                                            className={cn(
                                                "border-2 border-black font-black uppercase text-[10px] h-10 shadow-[2px_2px_0px_0px_black] transition-all",
                                                order.status === OrderStatus.READY ? "bg-black text-white hover:bg-[#DC143C]" : "bg-black/10 text-black/40 border-black/10 shadow-none"
                                            )}
                                            onClick={() => handleMarkServed(order.id)}
                                        >
                                            Mark Served
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
