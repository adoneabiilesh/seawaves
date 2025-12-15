'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductCategory, RestaurantSettings } from '../types';
import { generateProductMetadata, generateProductImage, parseMenuFromImage } from '../services/geminiService';
import { Sparkles, Loader2, Save, Camera, ImagePlus, QrCode, Trash2, LayoutGrid, Package, Settings, AlertTriangle, Users, TrendingUp, DollarSign, Activity, Edit3, X, Eye, EyeOff, Bell, Clock, CreditCard, Table as TableIcon } from 'lucide-react';
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

  // Table State
  const [newTableNum, setNewTableNum] = useState('');

  // New State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);

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

  // Stats Data
  const categoryStats = Object.values(ProductCategory).map(cat => ({
    name: cat,
    count: products.filter(p => p.category === cat).length,
  })).filter(s => s.count > 0);
  
  // Mock Revenue Data
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
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 border border-[#111111] text-xs sm:text-sm overflow-x-auto">
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#111111]/70">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-[#111111]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#111111]">$2,450.00</div>
                  <p className="text-xs text-[#111111]/50 mt-1">+12% vs yesterday</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#111111]/70">Total Orders</CardTitle>
                  <Package className="h-4 w-4 text-[#111111]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#111111]">84</div>
                  <p className="text-xs text-[#111111]/50 mt-1">4 Pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#111111]/70">Low Stock Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-[#111111]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#111111]">{products.filter(p => p.stock < 5).length}</div>
                  <p className="text-xs text-[#111111]/50 mt-1">Action Needed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#111111]/70">Top Item</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#111111]" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-[#111111] truncate">Wagyu Burger</div>
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
                <ResponsiveContainer width="100%" height={350}>
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

          {/* Menu Tab */}
          <TabsContent value="menu" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" /> AI Menu Creator
                    </CardTitle>
                    <CardDescription>Generate menu items using AI</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isGenerating}
                        className="h-auto py-8 flex flex-col items-center gap-3 border-2 border-dashed"
                    >
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        <Camera className="h-8 w-8" />
                        <div className="text-center">
                          <h3 className="font-bold">Scan Menu Photo</h3>
                          <p className="text-xs text-[#111111]/50 mt-1">AI extracts text, allergens, and translations</p>
                        </div>
                      </Button>

                      <Card className="border border-[#111111]">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <ImagePlus className="h-4 w-4" /> Generate from Text
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Textarea
                            placeholder="Dish names (e.g. Lobster Bisque)..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            disabled={isGenerating}
                            rows={3}
                        />
                          <Button
                            onClick={handleTextGenerate}
                            disabled={isGenerating || !inputText.trim()}
                            className="w-full"
                        >
                            {isGenerating ? 'Processing...' : 'Generate Dishes'}
                          </Button>
                        </CardContent>
                      </Card>
                </div>

                {isGenerating && (
                      <div className="flex items-center gap-3 p-4 bg-[#111111] text-[#FFFFFE] rounded-md">
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span className="font-medium">{statusMessage}</span>
                    </div>
                )}
                  </CardContent>
                </Card>

            {generatedDrafts.length > 0 && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Review Drafts ({generatedDrafts.length})</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setGeneratedDrafts([])}>
                        Clear All
                      </Button>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedDrafts.map((draft) => (
                          <Card key={draft.id} className="border border-[#111111]">
                            <CardContent className="p-4 space-y-3">
                            <div className="flex gap-4">
                                <img src={draft.imageUrl || "https://placehold.co/100"} alt="Draft" className="w-20 h-20 rounded-lg object-cover border border-[#111111]" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[#111111] truncate">{draft.name.en}</h4>
                                    <p className="text-xs text-[#111111]/50 line-clamp-2 mt-1">{draft.description.en}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {draft.allergens.map(a => (
                                            <span key={a} className="text-[9px] bg-[#111111] text-[#FFFFFE] px-1.5 py-0.5 rounded border border-[#111111]">
                                        {a}
                                      </span>
                                    ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setGeneratedDrafts(prev => prev.filter(p => p.id !== draft.id))} className="flex-1">
                                  Discard
                                </Button>
                                <Button 
                                  size="sm"
                                    onClick={() => handleSaveDraft(draft)} 
                                    disabled={!draft.imageUrl}
                                  className="flex-1"
                                >
                                    {draft.imageUrl ? 'Approve' : 'Loading...'}
                                </Button>
                            </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                    </CardContent>
                  </Card>
            )}
            </div>
            
              <Card>
                <CardHeader>
                  <CardTitle>Menu Composition</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryStats}>
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#111111'}} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#111111'}} />
                        <Tooltip />
                      <Bar dataKey="count" fill="#111111" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Inventory & Menu Management</CardTitle>
                  <CardDescription>Manage product availability and stock</CardDescription>
                  </div>
                <div className="flex gap-4 text-sm text-[#111111]/50">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#111111]"></span> Live
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full border border-[#111111]"></span> Hidden
                  </span>
              </div>
              </CardHeader>
              <CardContent>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#111111]">
                      <tr>
                        <th className="p-4 font-semibold text-[#111111]">Status</th>
                        <th className="p-4 font-semibold text-[#111111]">Product</th>
                        <th className="p-4 font-semibold text-[#111111]">Price</th>
                        <th className="p-4 font-semibold text-[#111111]">Stock</th>
                        <th className="p-4 font-semibold text-[#111111]">Actions</th>
                          </tr>
                      </thead>
                    <tbody className="divide-y divide-[#111111]/10">
                          {products.map(product => (
                        <tr key={product.id} className="hover:bg-[#111111]/5">
                                  <td className="p-4">
                            <Button variant="ghost" size="icon" onClick={() => toggleAvailability(product.id)}>
                              {product.available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                                  </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={product.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-[#111111]" alt="" />
                                      <div>
                                <div className="font-semibold text-[#111111]">{product.name.en}</div>
                                <div className="text-xs text-[#111111]/50">{product.category}</div>
                              </div>
                                      </div>
                                  </td>
                          <td className="p-4 font-semibold text-[#111111]">${product.price.toFixed(2)}</td>
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                              <Button variant="outline" size="icon" onClick={() => handleStockUpdate(product.id, product.stock - 1)}>
                                -
                              </Button>
                              <span className={cn("font-bold w-8 text-center", product.stock < 5 && "text-[#111111]")}>
                                {product.stock}
                              </span>
                              <Button variant="outline" size="icon" onClick={() => handleStockUpdate(product.id, product.stock + 1)}>
                                +
                              </Button>
                                      </div>
                                  </td>
                                  <td className="p-4">
                            <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>
                              <Edit3 className="h-4 w-4 mr-2" /> Edit
                            </Button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Table</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                    <Input 
                            type="number" 
                      placeholder="Table Number" 
                            value={newTableNum} 
                            onChange={e => setNewTableNum(e.target.value)} 
                        />
                    <Button 
                            onClick={() => {
                                const n = parseInt(newTableNum);
                                if(n > 0 && !tables.includes(n)) {
                                    onAddTable(n);
                                    setNewTableNum('');
                                }
                            }}
                    >
                      Add
                    </Button>
                    </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Active Tables</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        {tables.map(t => (
                      <Card key={t} className="border border-[#111111] relative group">
                        <CardContent className="p-4 flex flex-col items-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                            onClick={() => onRemoveTable(t)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                                <span className="font-bold text-lg mb-2">Table {t}</span>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://culinary-ai.app/login?table=${t}`} 
                            className="w-20 h-20 border border-[#111111]" 
                            alt="QR" 
                          />
                        </CardContent>
                      </Card>
                        ))}
                    </div>
                </CardContent>
              </Card>
                </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Restaurant Settings</CardTitle>
                <CardDescription>Configure your restaurant details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">Restaurant Name</label>
                  <Input 
                        type="text" 
                        value={settings.name} 
                        onChange={(e) => onUpdateSettings({...settings, name: e.target.value})}
                      />
                  </div>
                  <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">Brand Logo URL</label>
                  <Input 
                        type="text" 
                        value={settings.logoUrl || ''} 
                        onChange={(e) => onUpdateSettings({...settings, logoUrl: e.target.value})}
                        placeholder="https://..."
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                    <label className="block text-sm font-semibold text-[#111111] mb-2">Currency</label>
                    <Input 
                            type="text" 
                            value={settings.currency} 
                            onChange={(e) => onUpdateSettings({...settings, currency: e.target.value})}
                        />
                      </div>
                      <div>
                    <label className="block text-sm font-semibold text-[#111111] mb-2">Tax Rate (%)</label>
                    <Input 
                            type="number" 
                            value={settings.taxRate} 
                            onChange={(e) => onUpdateSettings({...settings, taxRate: parseFloat(e.target.value)})}
                        />
                      </div>
                  </div>
                  <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">Opening Hours</label>
                  <Input 
                        type="text" 
                        value={settings.openingHours || ''} 
                        onChange={(e) => onUpdateSettings({...settings, openingHours: e.target.value})}
                        placeholder="Mon-Sun: 9am - 10pm"
                      />
                  </div>
                   <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">Address</label>
                  <Input 
                        type="text" 
                        value={settings.address || ''} 
                        onChange={(e) => onUpdateSettings({...settings, address: e.target.value})}
                      />
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Table Orders Tab */}
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

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <PaymentTracker
              payments={payments}
              onRefund={(id) => {
                console.log('Refund payment:', id);
              }}
            />
          </TabsContent>

          {/* Customization Tab */}
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

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <ScheduleManager
              schedule={schedule}
              onUpdate={(newSchedule) => setSchedule(newSchedule)}
            />
          </TabsContent>

          {/* Notifications Tab */}
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

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Staff Management</CardTitle>
                  <CardDescription>Manage your restaurant staff</CardDescription>
              </div>
                <Button>
                  <Users className="h-4 w-4 mr-2" /> Add Staff
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#111111]">
                      <tr>
                        <th className="p-4 font-semibold text-[#111111]">Name</th>
                        <th className="p-4 font-semibold text-[#111111]">Role</th>
                        <th className="p-4 font-semibold text-[#111111]">Status</th>
                        <th className="p-4 font-semibold text-[#111111]">Last Active</th>
                      </tr>
                  </thead>
                    <tbody className="divide-y divide-[#111111]/10">
                      <tr className="hover:bg-[#111111]/5">
                        <td className="p-4 font-semibold text-[#111111]">Restaurant Manager</td>
                        <td className="p-4">
                          <span className="bg-[#111111] text-[#FFFFFE] px-2 py-1 rounded-full text-xs font-bold border border-[#111111]">
                            Admin
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[#111111] flex items-center gap-1">
                            <span className="w-2 h-2 bg-[#111111] rounded-full"></span> Active
                          </span>
                        </td>
                        <td className="p-4 text-[#111111]/50">Just now</td>
                      </tr>
                      <tr className="hover:bg-[#111111]/5">
                        <td className="p-4 font-semibold text-[#111111]">Head Chef</td>
                        <td className="p-4">
                          <span className="bg-[#FFFFFE] text-[#111111] border border-[#111111] px-2 py-1 rounded-full text-xs font-bold">
                            Kitchen
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[#111111]/50 flex items-center gap-1">
                            <span className="w-2 h-2 border border-[#111111] rounded-full"></span> Offline
                          </span>
                        </td>
                        <td className="p-4 text-[#111111]/50">2 hours ago</td>
                      </tr>
                  </tbody>
              </table>
          </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      
      {/* Edit Product Modal */}
      {editingProduct && (
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
                            onChange={e => setEditingProduct({...editingProduct, name: {...editingProduct.name, en: e.target.value}})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                    <label className="block text-sm font-semibold text-black mb-2">Price</label>
                    <Input 
                                type="number" 
                                value={editingProduct.price} 
                                onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                            />
                          </div>
                           <div>
                    <label className="block text-sm font-semibold text-black mb-2">Calories</label>
                    <Input 
                                type="number" 
                                value={editingProduct.nutrition.calories} 
                                onChange={e => setEditingProduct({...editingProduct, nutrition: {...editingProduct.nutrition, calories: parseFloat(e.target.value)}})}
                            />
                          </div>
                      </div>
                      <div>
                  <label className="block text-sm font-semibold text-black mb-2">Recipe (English)</label>
                  <Textarea 
                            rows={4}
                            value={editingProduct.recipe?.en || ''} 
                            onChange={e => setEditingProduct({...editingProduct, recipe: {...editingProduct.recipe, en: e.target.value}})}
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
      )}
      </div>
    </div>
  );
};
