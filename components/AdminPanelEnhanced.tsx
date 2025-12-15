'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductCategory, RestaurantSettings } from '../types';
import { generateProductMetadata, generateProductImage, parseMenuFromImage } from '../services/geminiService';
import { Sparkles, Loader2, Camera, ImagePlus, QrCode, Trash2, LayoutGrid, Package, Settings, AlertTriangle, Users, TrendingUp, DollarSign, Activity, Edit3, X, Eye, EyeOff, Bell, Clock, CreditCard, Table as TableIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { NotificationCenter, Notification } from './NotificationCenter';
import { ScheduleManager, ScheduleDay } from './ScheduleManager';
import { ProductCustomization, Category, Addon } from './ProductCustomization';
import { PaymentTracker, PaymentRecord } from './PaymentTracker';
import { TableOrdersManager, TableOrder } from './TableOrdersManager';

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  tables: number[];
  onAddTable: (num: number) => void;
  onRemoveTable: (num: number) => void;
  settings: RestaurantSettings;
  onUpdateSettings: (s: RestaurantSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    products, 
    onAddProduct, 
    onUpdateProduct,
    tables, 
    onAddTable, 
    onRemoveTable,
    settings,
    onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'inventory' | 'tables' | 'settings' | 'staff' | 'notifications' | 'schedule' | 'customization' | 'payments' | 'table-orders'>('overview');
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDrafts, setGeneratedDrafts] = useState<Product[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newTableNum, setNewTableNum] = useState('');

  // New State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);

  // Mock data for demo
  useEffect(() => {
    // Simulate notifications
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

  // Stats Data
  const categoryStats = Object.values(ProductCategory).map(cat => ({
    name: cat,
    count: products.filter(p => p.category === cat).length,
  })).filter(s => s.count > 0);
  
  const revenueData = [
      { name: '10am', value: 120 }, { name: '11am', value: 250 }, { name: '12pm', value: 890 },
      { name: '1pm', value: 1200 }, { name: '2pm', value: 750 }, { name: '3pm', value: 400 },
      { name: '4pm', value: 320 }, { name: '5pm', value: 600 }, { name: '6pm', value: 1100 },
  ];

  const handleTextGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setStatusMessage('Initializing AI Agents...');
    
    const items = inputText.split(/[,\n]+/).map(s => s.trim()).filter(s => s.length > 0);
    const newDrafts: Product[] = [];

    for (const itemName of items) {
      try {
        setStatusMessage(`Analyzing culinary data for "${itemName}"...`);
        const metadata = await generateProductMetadata(itemName);
        
        setStatusMessage(`Cooking up visual concepts for "${itemName}"...`);
        const imageUrl = await generateProductImage(itemName, metadata.description.en);

        const newProduct: Product = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: metadata.name,
          description: metadata.description,
          recipe: metadata.recipe,
          price: metadata.price,
          category: metadata.category,
          imageUrl: imageUrl,
          nutrition: metadata.nutrition,
          allergens: metadata.allergens,
          stock: 20,
          isAiGenerated: true,
          available: true
        };

        newDrafts.push(newProduct);
      } catch (error) {
        console.error(`Error generating ${itemName}:`, error);
      }
    }

    setGeneratedDrafts(prev => [...prev, ...newDrafts]);
    setIsGenerating(false);
    setInputText('');
    setStatusMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    setStatusMessage('Scanning menu image...');

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result as string;
            
            try {
                setStatusMessage('AI is reading the menu & translating...');
                const parsedItems = await parseMenuFromImage(base64Image);
                
                setStatusMessage(`Found ${parsedItems.length} items. Starting kitchen simulation...`);

                const draftsWithPlaceholders: Product[] = parsedItems.map(item => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: item.name,
                    description: item.description,
                    recipe: item.recipe,
                    price: item.price,
                    category: item.category,
                    imageUrl: '', 
                    nutrition: item.nutrition,
                    allergens: item.allergens,
                    stock: 20,
                    isAiGenerated: true,
                    available: true
                }));

                setGeneratedDrafts(prev => [...prev, ...draftsWithPlaceholders]);

                for (const draft of draftsWithPlaceholders) {
                    generateProductImage(draft.name.en, draft.description.en).then(url => {
                        setGeneratedDrafts(prev => prev.map(p => 
                            p.id === draft.id ? { ...p, imageUrl: url } : p
                        ));
                    }).catch(err => console.error(err));
                }

            } catch (error) {
                console.error("Error parsing menu:", error);
                setStatusMessage('Failed to read menu. Please try a clearer photo.');
            } finally {
                setIsGenerating(false);
                setStatusMessage('');
            }
        };
    } catch (error) {
        console.error("File reading error", error);
        setIsGenerating(false);
    }
  };

  const handleSaveDraft = (product: Product) => {
    if (!product.imageUrl) return; 
    onAddProduct(product);
    setGeneratedDrafts(prev => prev.filter(p => p.id !== product.id));
  };

  const handleStockUpdate = (id: string, newStock: number) => {
    const p = products.find(prod => prod.id === id);
    if (p) {
        onUpdateProduct({ ...p, stock: Math.max(0, newStock) });
    }
  };
  
  const toggleAvailability = (id: string) => {
    const p = products.find(prod => prod.id === id);
    if (p) {
        onUpdateProduct({ ...p, available: !p.available });
    }
  };

  const saveEditedProduct = () => {
      if (editingProduct) {
          onUpdateProduct(editingProduct);
          setEditingProduct(null);
      }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFE] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* Header with Notifications */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#111111] pb-4 sm:pb-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#111111]">Admin Dashboard</h1>
            <p className="text-[#111111]/70 mt-1 text-sm sm:text-base">Manage {settings.name} operations</p>
          </div>
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
            onMarkAllAsRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            onClear={() => setNotifications([])}
          />
        </div>
        
        {/* Tabs - Responsive */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 border border-[#111111] text-xs sm:text-sm">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-1 sm:gap-2">
              <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Menu AI</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-1 sm:gap-2">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="table-orders" className="flex items-center gap-1 sm:gap-2">
              <TableIcon className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden lg:inline">Table Orders</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1 sm:gap-2">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden lg:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center gap-1 sm:gap-2">
              <QrCode className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Tables</span>
            </TabsTrigger>
            <TabsTrigger value="customization" className="flex items-center gap-1 sm:gap-2">
              <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden lg:inline">Customize</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1 sm:gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden lg:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden lg:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Staff</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Keep existing */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-[#111111]/70">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-[#111111]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-[#111111]">$2,450.00</div>
                  <p className="text-xs text-[#111111]/50 mt-1">+12% vs yesterday</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-[#111111]/70">Total Orders</CardTitle>
                  <Package className="h-4 w-4 text-[#111111]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-[#111111]">84</div>
                  <p className="text-xs text-[#111111]/50 mt-1">4 Pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-[#111111]/70">Low Stock Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-[#111111]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-[#111111]">{products.filter(p => p.stock < 5).length}</div>
                  <p className="text-xs text-[#111111]/50 mt-1">Action Needed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-[#111111]/70">Top Item</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#111111]" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-xl font-bold text-[#111111] truncate">Wagyu Burger</div>
                  <p className="text-xs text-[#111111]/50 mt-1">42 sold today</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Daily revenue trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#111111" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#111111" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#111111" strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#111111', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#111111', fontSize: 12}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#111111" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Tabs */}
          <TabsContent value="table-orders" className="space-y-4">
            <TableOrdersManager
              tableOrders={tableOrders}
              onCloseTable={(tableNum) => {
                setTableOrders(prev => prev.filter(to => to.tableNumber !== tableNum));
              }}
              onViewOrder={(orderId) => {
                console.log('View order:', orderId);
              }}
            />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <PaymentTracker
              payments={payments}
              onRefund={(id) => {
                console.log('Refund payment:', id);
              }}
            />
          </TabsContent>

          <TabsContent value="customization" className="space-y-4">
            <ProductCustomization
              products={products}
              categories={categories}
              addons={addons}
              onUpdateProduct={onUpdateProduct}
              onAddCategory={(cat) => setCategories(prev => [...prev, cat])}
              onUpdateCategory={(cat) => setCategories(prev => prev.map(c => c.id === cat.id ? cat : c))}
              onDeleteCategory={(id) => setCategories(prev => prev.filter(c => c.id !== id))}
              onAddAddon={(addon) => setAddons(prev => [...prev, addon])}
              onUpdateAddon={(addon) => setAddons(prev => prev.map(a => a.id === addon.id ? addon : a))}
              onDeleteAddon={(id) => setAddons(prev => prev.filter(a => a.id !== id))}
            />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <ScheduleManager
              schedule={schedule}
              onUpdate={(newSchedule) => setSchedule(newSchedule)}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="border border-[#111111]">
              <CardHeader>
                <CardTitle>All Notifications</CardTitle>
                <CardDescription>View and manage all customer activity notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-[#111111]/50">
                      <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 border border-[#111111] rounded-md",
                          !notification.read && "bg-[#111111]/5"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#111111]">{notification.title}</h3>
                            <p className="text-sm text-[#111111]/70 mt-1">{notification.message}</p>
                            <p className="text-xs text-[#111111]/50 mt-2">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-[#111111] flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keep existing tabs (menu, inventory, tables, settings, staff) */}
          {/* ... existing code ... */}
        </Tabs>
      </div>
    </div>
  );
};





