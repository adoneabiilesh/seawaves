'use client';

import React, { useState } from 'react';
import { useApp } from '../app/providers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Package, Clock, TrendingUp, AlertTriangle, ChefHat, LayoutGrid } from 'lucide-react';
import { MenuManager } from './Admin/MenuManager';
import { KitchenDisplay } from './KitchenDisplay';
import { OrderStatus } from '@/types';

export const ManagerDashboard = () => {
    const {
        products,
        orders,
        settings,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        setOrders
    } = useApp();

    const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'kitchen'>('overview');

    const pendingOrders = (orders || []).filter(o => o.status === 'pending').length;
    const lowStockItems = (products || []).filter(p => p.stock < 5).length;
    const todayRevenue = (orders || [])
        .filter(o => o.createdAt && new Date(o.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, o) => sum + o.total, 0);

    const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
        setOrders(prev => Array.isArray(prev) ? prev.map(o => o.id === orderId ? { ...o, status } : o) : []);
    };

    return (
        <div className="min-h-screen bg-[#FFFFFE] p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#111111] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#111111]">Manager Dashboard</h1>
                        <p className="text-[#111111]/70 mt-1">Operational control for {settings.name}</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 border border-[#111111] mb-6">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="inventory">Inventory</TabsTrigger>
                        <TabsTrigger value="kitchen">Kitchen Stream</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border border-[#111111]">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                                    <Clock className="h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{pendingOrders}</div>
                                </CardContent>
                            </Card>
                            <Card className="border border-[#111111]">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
                                    <TrendingUp className="h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">${todayRevenue.toFixed(2)}</div>
                                </CardContent>
                            </Card>
                            <Card className="border border-[#111111] bg-yellow-50">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-yellow-600">{lowStockItems}</div>
                                </CardContent>
                            </Card>
                            <Card className="border border-[#111111]">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Active Menu</CardTitle>
                                    <LayoutGrid className="h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{products.length}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border border-[#111111]">
                            <CardHeader>
                                <CardTitle>Active Operation Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED).slice(0, 10).map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-4 border border-[#111111]/20 rounded-md">
                                            <div>
                                                <p className="font-semibold">Order #{order.id.slice(-4)}</p>
                                                <p className="text-xs text-[#111111]/50">Table {order.tableNumber} • {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'N/A'}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border-2 border-black ${order.status === 'pending' ? 'bg-yellow-100' : 'bg-blue-100'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                                <div className="font-black">${order.total.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* INVENTORY */}
                    <TabsContent value="inventory">
                        <MenuManager
                            products={products}
                            categories={categories}
                            addons={[]}
                            restaurantId={settings?.name?.toLowerCase().replace(/\s+/g, '-') || 'default'}
                            onAddProduct={addProduct}
                            onUpdateProduct={updateProduct}
                            onDeleteProduct={deleteProduct}
                            onAddCategory={addCategory}
                            onUpdateCategory={updateCategory}
                            onDeleteCategory={deleteCategory}
                            onAddAddon={() => { }}
                            onUpdateAddon={() => { }}
                            onDeleteAddon={() => { }}
                        />
                    </TabsContent>

                    {/* KITCHEN STREAM */}
                    <TabsContent value="kitchen">
                        <KitchenDisplay
                            orders={orders}
                            onUpdateStatus={handleUpdateOrderStatus}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};
