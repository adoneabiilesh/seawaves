'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, Category, Addon, RestaurantSettings } from '../types';
import { Sparkles, LayoutGrid, Package, Settings, AlertTriangle, Users, TrendingUp, DollarSign, Activity, Bell, CreditCard, Table as TableIcon, Calendar, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { NotificationCenter, Notification } from './NotificationCenter';
import { PaymentTracker, PaymentRecord } from './PaymentTracker';
import { MenuManager } from './Admin/MenuManager';
import { TableManager } from './Admin/TableManager';
import { SessionTableManager } from './Admin/SessionTableManager';
import { TeamManager } from './Admin/TeamManager';
import { TableOrder } from './TableOrdersManager';
import { OrdersPanel } from './Admin/OrdersPanel';
import { InventoryAlerts } from './Admin/InventoryAlerts';
import { useApp } from '@/app/providers';

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  tables: number[];
  onAddTable: (num: number) => void;
  onRemoveTable: (num: number) => void;
  settings: RestaurantSettings;
  onUpdateSettings: (s: RestaurantSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  tables,
  onAddTable,
  onRemoveTable,
  settings,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'tables' | 'settings' | 'payments' | 'team'>('overview');
  const { tenant, restaurantId } = useApp();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const saveEditedProduct = () => {
    if (editingProduct) {
      onUpdateProduct(editingProduct);
      setEditingProduct(null);
    }
  };

  // State
  // const [categories, setCategories] = useState<Category[]>([]); // Handled by prop
  const [addons, setAddons] = useState<Addon[]>([]);
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([
    {
      id: 'to1',
      tableNumber: 5,
      sessionId: 'sess1',
      orders: [
        {
          id: 'o1',
          items: [{ name: "Wagyu Burger", quantity: 2, price: 15.00 }, { name: "Truffle Fries", quantity: 1, price: 10.50 }],
          total: 40.50,
          status: 'pending',
          createdAt: new Date(Date.now() - 30 * 60000),
          paymentStatus: 'unpaid'
        }
      ],
      totalAmount: 40.50,
      paidAmount: 0,
      startedAt: new Date(Date.now() - 30 * 60000),
      lastActivity: new Date(),
      isActive: true,
    },
    {
      id: 'to2',
      tableNumber: 2,
      sessionId: 'sess2',
      orders: [
        {
          id: 'o2',
          items: [{ name: "Caesar Salad", quantity: 3, price: 5.00 }],
          total: 15.00,
          status: 'served',
          createdAt: new Date(Date.now() - 10 * 60000),
          paymentStatus: 'paid'
        }
      ],
      totalAmount: 15.00,
      paidAmount: 15.00,
      startedAt: new Date(Date.now() - 40 * 60000),
      lastActivity: new Date(Date.now() - 10 * 60000),
      isActive: true, // Kept active for demo, though paid
    },
  ]);
  const [payments, setPayments] = useState<PaymentRecord[]>([
    {
      id: '1', orderId: '101', orderNumber: '1001', amount: 45.50, currency: '$',
      paymentMethod: 'Card', status: 'completed', tableNumber: 5, customerName: 'John Doe',
      createdAt: new Date(), platformFee: 2.00, restaurantPayout: 43.50, orderType: 'pos'
    },
    {
      id: '2', orderId: '102', orderNumber: '1002', amount: 12.00, currency: '$',
      paymentMethod: 'Cash', status: 'completed', tableNumber: 2, customerName: 'Walk-in',
      createdAt: new Date(), platformFee: 0, restaurantPayout: 12.00, orderType: 'cash'
    }
  ]);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Mock notifications for demo
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'order',
        title: 'New Order',
        message: 'Table 5 placed an order for $45.50',
        timestamp: new Date(Date.now() - 5 * 60000),
        read: false,
        orderId: '123',
        tableNumber: 5,
      },
      {
        id: '2',
        type: 'payment',
        title: 'Payment Received',
        message: 'Table 3 paid $32.00 via Card',
        timestamp: new Date(Date.now() - 15 * 60000),
        read: false,
        orderId: '124',
        tableNumber: 3,
      },
    ];
    setNotifications(mockNotifications);
  }, []);

  // Stats
  const revenueData = [
    { name: '10am', value: 120 }, { name: '11am', value: 250 }, { name: '12pm', value: 890 },
    { name: '1pm', value: 1200 }, { name: '2pm', value: 750 }, { name: '3pm', value: 400 },
    { name: '4pm', value: 320 }, { name: '5pm', value: 600 }, { name: '6pm', value: 1100 },
  ];

  const totalRevenue = payments.reduce((acc, p) => p.status === 'completed' ? acc + p.amount : acc, 0);

  return (
    <div className="min-h-screen bg-[#FFFFFE] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#111111] pb-4 sm:pb-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#111111]">Admin Dashboard</h1>
            <p className="text-[#111111]/70 mt-1 text-sm sm:text-base">Manage {settings.name}</p>
          </div>
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
            onMarkAllAsRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            onClear={() => setNotifications([])}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-7 border border-[#111111] overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="relative">
              Orders
            </TabsTrigger>
            <TabsTrigger value="menu">Menu & AI</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="space-y-6">
            {restaurantId ? (
              <OrdersPanel restaurantId={restaurantId} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Restaurant not found. Please ensure you are logged in.</p>
              </div>
            )}
          </TabsContent>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#111111]/70">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-[#111111]/50">Includes Cash & Online</p>
                </CardContent>
              </Card>
              {/* ... (other cards can stay or change - keeping generic for now) */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#111111]/70">Active Tables</CardTitle>
                  <TableIcon className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tableOrders.filter(o => o.isActive).length}</div>
                  <p className="text-xs text-[#111111]/50">{tables.length} Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#111111]/70">Total Products</CardTitle>
                  <Package className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.length}</div>
                  <p className="text-xs text-[#111111]/50">{products.filter(p => !p.available).length} hidden</p>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Alerts - show low/out of stock items */}
            <InventoryAlerts threshold={10} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Graph */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Revenue Analytics</CardTitle>
                    <CardDescription>Daily performance metrics</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#111111]/50" />
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-auto h-8"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#111111" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#111111" fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Open Tables List */}
              <Card>
                <CardHeader>
                  <CardTitle>Ongoing Tables</CardTitle>
                  <CardDescription>Currently active sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tableOrders.filter(t => t.isActive).length === 0 ? (
                      <p className="text-[#111111]/50 text-center py-4">No open tables</p>
                    ) : (
                      tableOrders.filter(t => t.isActive).map(order => (
                        <div key={order.tableNumber} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <div className="font-bold">Table {order.tableNumber}</div>
                            <div className="text-xs text-gray-500">{order.orders.length} orders</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">${order.totalAmount.toFixed(2)}</div>
                            <div className="text-xs text-green-600">Active</div>
                          </div>
                        </div>
                      ))
                    )}
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('tables')}>
                      Manage All Tables
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* MENU TAB */}
          <TabsContent value="menu">
            <MenuManager
              products={products}
              categories={categories}
              addons={addons}
              restaurantId={settings?.name?.toLowerCase().replace(/\s+/g, '-') || 'default'}
              onAddProduct={onAddProduct}
              onUpdateProduct={onUpdateProduct}
              onDeleteProduct={onDeleteProduct}
              onAddCategory={onAddCategory}
              onUpdateCategory={onUpdateCategory}
              onDeleteCategory={onDeleteCategory}
              onAddAddon={(addon) => setAddons([...addons, addon])}
              onUpdateAddon={(addon) => setAddons(addons.map(a => a.id === addon.id ? addon : a))}
              onDeleteAddon={(id) => setAddons(addons.filter(a => a.id !== id))}
            />
          </TabsContent>

          {/* TABLES TAB */}
          <TabsContent value="tables">
            <TableManager
              tables={tables}
              tableOrders={tableOrders}
              onAddTable={onAddTable}
              onRemoveTable={onRemoveTable}
              onCloseTable={(num) => setTableOrders(prev => prev.map(to => to.tableNumber === num ? { ...to, isActive: false } : to))}
            />
          </TabsContent>

          {/* TABLES TAB */}
          <TabsContent value="tables" className="space-y-6">
            <SessionTableManager
              tables={tables}
              onAddTable={onAddTable}
              onRemoveTable={onRemoveTable}
            />
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments">
            <PaymentTracker payments={payments} />
          </TabsContent>

          {/* TEAM TAB */}
          <TabsContent value="team">
            <TeamManager />
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Restaurant Settings</CardTitle>
                <CardDescription>Configure your restaurant details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">Restaurant Name</label>
                  <Input value={settings.name} onChange={(e) => onUpdateSettings({ ...settings, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">Brand Logo URL</label>
                  <Input value={settings.logoUrl || ''} onChange={(e) => onUpdateSettings({ ...settings, logoUrl: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#111111] mb-2">Currency</label>
                    <Input value={settings.currency} onChange={(e) => onUpdateSettings({ ...settings, currency: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#111111] mb-2">Tax Rate (%)</label>
                    <Input type="number" value={settings.taxRate} onChange={(e) => onUpdateSettings({ ...settings, taxRate: parseFloat(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">Address</label>
                  <Input value={settings.address || ''} onChange={(e) => onUpdateSettings({ ...settings, address: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Product Modal */}
        {
          editingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/50 backdrop-blur-sm">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Edit Product</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setEditingProduct(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Name (English)</label>
                    <Input
                      type="text"
                      value={editingProduct.name.en}
                      onChange={e => setEditingProduct({ ...editingProduct, name: { ...editingProduct.name, en: e.target.value } })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">Price</label>
                      <Input
                        type="number"
                        value={editingProduct.price}
                        onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">Calories</label>
                      <Input
                        type="number"
                        value={editingProduct.nutrition?.calories || 0}
                        onChange={e => setEditingProduct({ ...editingProduct, nutrition: { ...(editingProduct.nutrition || {}), calories: parseFloat(e.target.value) } })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Recipe (English)</label>
                    <Textarea
                      rows={4}
                      value={editingProduct.recipe?.en || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, recipe: { ...editingProduct.recipe, en: e.target.value } })}
                      placeholder="Enter preparation steps..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEditingProduct(null)}>
                      Cancel
                    </Button>
                    <Button onClick={saveEditedProduct}>
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        }
      </div >
    </div >
  );
};
