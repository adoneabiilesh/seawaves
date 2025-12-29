'use client';

import React, { useState, useRef } from 'react';
import { Product, ProductCategory, Category, Addon } from '../../types';
import { generateProductMetadata, generateProductImage, parseMenuFromImage } from '../../services/geminiService';
import { Sparkles, Loader2, Save, Camera, ImagePlus, Trash2, Edit3, X, Eye, EyeOff, Plus, Search, Wine, Utensils, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '@/lib/utils';
import { ImageUploader } from './ImageUploader';

// Common allergens for quick selection
const COMMON_ALLERGENS = ['Gluten', 'Dairy', 'Nuts', 'Peanuts', 'Shellfish', 'Fish', 'Eggs', 'Soy', 'Sesame', 'Celery', 'Mustard', 'Sulfites'];

interface MenuManagerProps {
    products: Product[];
    categories: Category[];
    addons: Addon[];
    restaurantId: string;
    onAddProduct: (product: Product) => void;
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (id: string) => void;
    onAddCategory: (category: Category) => void;
    onUpdateCategory: (category: Category) => void;
    onDeleteCategory: (id: string) => void;
    onAddAddon: (addon: Addon) => void;
    onUpdateAddon: (addon: Addon) => void;
    onDeleteAddon: (id: string) => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
    products,
    categories,
    addons,
    restaurantId,
    onAddProduct,
    onUpdateProduct,
    onDeleteProduct,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    onAddAddon,
    onUpdateAddon,
    onDeleteAddon,
}) => {
    const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'addons' | 'ai'>('products');
    const [searchQuery, setSearchQuery] = useState('');

    // AI State
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedDrafts, setGeneratedDrafts] = useState<Product[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit States
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingAddon, setEditingAddon] = useState<Addon | null>(null);

    // New Item States
    const [newCategory, setNewCategory] = useState<Partial<Category>>({ name: '', description: '', displayOrder: 0, available: true });
    const [newAddon, setNewAddon] = useState<Partial<Addon>>({ name: '', price: 0, category: '', available: true });

    const filteredProducts = products.filter(p =>
        p.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper to safely get display name from JSONB or string
    const getDisplayName = (name: any): string => {
        if (!name) return '';
        if (typeof name === 'string') return name;
        if (typeof name === 'object' && name.en) return name.en;
        return String(name);
    };

    // AI Handlers
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
                    allergens: metadata.allergens || [],
                    ingredients: metadata.ingredients || [],
                    pairings: metadata.pairings || { drinks: [], foods: [] },
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
                        allergens: item.allergens || [],
                        ingredients: item.ingredients || [],
                        pairings: item.pairings || { drinks: [], foods: [] },
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

    // CRUD Handlers
    const handleSaveCategory = () => {
        if (!newCategory.name) return;
        onAddCategory({
            id: Date.now().toString(),
            name: { en: newCategory.name as string },  // Convert to JSONB format
            description: newCategory.description ? { en: newCategory.description as string } : undefined,
            displayOrder: newCategory.displayOrder || 0,
            available: true
        });
        setNewCategory({ name: '', description: '', displayOrder: 0, available: true });
    };

    const handleSaveAddon = () => {
        if (!newAddon.name) return;
        onAddAddon({
            id: Date.now().toString(),
            name: { en: newAddon.name as string },  // Convert to JSONB format
            price: newAddon.price || 0,
            category: newAddon.category || 'General',
            available: true
        });
        setNewAddon({ name: '', price: 0, category: '', available: true });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#111111]">Menu Management</h2>
                    <p className="text-[#111111]/70">Manage products, categories, additives, and AI generation</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab('ai')}>
                        <Sparkles className="h-4 w-4 mr-2" /> AI Assistant
                    </Button>
                    <Button onClick={() => {
                        setEditingProduct({
                            id: '',
                            name: { en: '' },
                            description: { en: '' },
                            price: 0,
                            category: '',
                            stock: 0,
                            available: true,
                            ingredients: []
                        });
                    }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Product
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-4 border border-[#111111]">
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="addons">Add-ons</TabsTrigger>
                    <TabsTrigger value="ai">AI Studio</TabsTrigger>
                </TabsList>

                {/* PRODUCTS TAB */}
                <TabsContent value="products" className="space-y-4">
                    <div className="flex gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#111111]/50" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map(product => (
                            <Card key={product.id} className="border border-[#111111] overflow-hidden group">
                                <div className="relative h-48">
                                    <img src={product.imageUrl || "https://placehold.co/400x300"} alt={product.name.en} className="w-full h-full object-cover" />
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="secondary" onClick={() => setEditingProduct(product)}>
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="destructive" onClick={() => onDeleteProduct(product.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {!product.available && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="bg-[#FFFFFE] px-3 py-1 rounded font-bold text-[#111111]">UNAVAILABLE</span>
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-[#111111]">{product.name.en}</h3>
                                            <p className="text-sm text-[#111111]/50">{product.category}</p>
                                        </div>
                                        <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-2 py-1 bg-[#111111]/5 rounded border border-[#111111]/10">Stock: {product.stock}</span>
                                        {product.ingredients?.length && <span className="px-2 py-1 bg-[#111111]/5 rounded border border-[#111111]/10">{product.ingredients.length} ingredients</span>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* CATEGORIES TAB */}
                <TabsContent value="categories" className="space-y-6">
                    <Card className="border border-[#111111]">
                        <CardHeader>
                            <CardTitle>Add Category</CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <Input placeholder="Name" value={typeof newCategory.name === 'string' ? newCategory.name : ''} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} />
                            <Input placeholder="Description" value={typeof newCategory.description === 'string' ? newCategory.description : ''} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} />
                            <Input type="number" placeholder="Order" className="w-24" value={newCategory.displayOrder || 0} onChange={e => setNewCategory({ ...newCategory, displayOrder: parseInt(e.target.value) || 0 })} />
                            <Button onClick={handleSaveCategory}><Plus className="h-4 w-4" /></Button>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        {categories.map(cat => (
                            <Card key={cat.id} className="border border-[#111111] flex items-center p-4">
                                <div className="flex-1">
                                    {editingCategory?.id === cat.id ? (
                                        <div className="flex gap-2">
                                            <Input value={getDisplayName(editingCategory.name)} onChange={e => setEditingCategory({ ...editingCategory, name: { en: e.target.value } as any })} />
                                            <Input value={getDisplayName(editingCategory.description)} onChange={e => setEditingCategory({ ...editingCategory, description: { en: e.target.value } as any })} />
                                            <Button size="icon" onClick={() => { onUpdateCategory(editingCategory); setEditingCategory(null); }}><Save className="h-4 w-4" /></Button>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="font-bold">{getDisplayName(cat.name)}</h3>
                                            <p className="text-sm text-[#111111]/50">{getDisplayName(cat.description)}</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingCategory(cat)}><Edit3 className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDeleteCategory(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* ADDONS TAB */}
                <TabsContent value="addons" className="space-y-6">
                    <Card className="border border-[#111111]">
                        <CardHeader>
                            <CardTitle>Add Add-on</CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <Input placeholder="Name" value={typeof newAddon.name === 'string' ? newAddon.name : ''} onChange={e => setNewAddon({ ...newAddon, name: e.target.value })} />
                            <Input type="number" placeholder="Price" className="w-32" value={newAddon.price || 0} onChange={e => setNewAddon({ ...newAddon, price: parseFloat(e.target.value) || 0 })} />
                            <Input placeholder="Category" value={typeof newAddon.category === 'string' ? newAddon.category : ''} onChange={e => setNewAddon({ ...newAddon, category: e.target.value })} />
                            <Button onClick={handleSaveAddon}><Plus className="h-4 w-4" /></Button>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {addons.map(addon => (
                            <Card key={addon.id} className="border border-[#111111]">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold">{getDisplayName(addon.name)}</h3>
                                        <p className="text-sm text-[#111111]/50">{addon.category}</p>
                                        <p className="font-bold mt-1">${(addon.price || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingAddon(addon)}><Edit3 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => onDeleteAddon(addon.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* AI STUDIO TAB */}
                <TabsContent value="ai" className="space-y-6">
                    <Card className="border border-[#111111] bg-[#111111]/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" /> AI Menu Generator
                            </CardTitle>
                            <CardDescription>Generate new dishes from text descriptions or scan physical menus.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Textarea
                                    placeholder="Describe dishes e.g. 'Spicy Tuna Roll with avocado'..."
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    rows={4}
                                />
                                <Button className="w-full" onClick={handleTextGenerate} disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Generate from Text
                                </Button>
                            </div>

                            <div
                                className="border-2 border-dashed border-[#111111]/20 rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-[#111111]/5 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <Camera className="h-8 w-8 mb-2 opacity-50" />
                                <span className="font-bold">Scan Menu Photo</span>
                                <span className="text-xs text-[#111111]/50">Upload an image to digitize</span>
                            </div>
                        </CardContent>
                    </Card>

                    {statusMessage && (
                        <div className="p-4 bg-[#111111] text-[#FFFFFE] rounded-lg flex items-center gap-3 animate-pulse">
                            <Loader2 className="animate-spin" />
                            {statusMessage}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedDrafts.map(draft => (
                            <Card key={draft.id} className="border border-[#111111]">
                                <div className="flex p-4 gap-4">
                                    <img src={draft.imageUrl} className="w-24 h-24 object-cover rounded-md bg-gray-200" />
                                    <div className="flex-1">
                                        <h4 className="font-bold">{draft.name.en || draft.name}</h4>
                                        <p className="text-xs text-[#111111]/60 line-clamp-2">{draft.description.en || draft.description}</p>
                                        <div className="flex gap-2 mt-4">
                                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setGeneratedDrafts(d => d.filter(x => x.id !== draft.id))}>Discard</Button>
                                            <Button size="sm" className="flex-1" onClick={() => handleSaveDraft(draft)}>Approve</Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Product Edit Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row justify-between items-center sticky top-0 bg-[#FFFFFE] z-10 border-b">
                            <CardTitle>{editingProduct.id ? 'Edit Product' : 'New Product'}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setEditingProduct(null)}><X className="h-4 w-4" /></Button>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold">Name</label>
                                        <Input value={editingProduct.name.en} onChange={e => setEditingProduct({ ...editingProduct, name: { ...editingProduct.name, en: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold">Category</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={editingProduct.category}
                                            onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.id} value={getDisplayName(c.name)}>{getDisplayName(c.name)}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-bold">Price</label>
                                            <Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold">Stock</label>
                                            <Input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold">Description</label>
                                    <Textarea className="h-[140px]" value={editingProduct.description.en} onChange={e => setEditingProduct({ ...editingProduct, description: { ...editingProduct.description, en: e.target.value } })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold">Ingredients (comma separated)</label>
                                <Textarea
                                    value={editingProduct.ingredients?.join(', ')}
                                    onChange={e => setEditingProduct({ ...editingProduct, ingredients: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                                    placeholder="e.g., Beef, Lettuce, Tomato, Cheese..."
                                />
                            </div>

                            {/* Allergens Selection */}
                            <div>
                                <label className="text-sm font-bold flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Allergens
                                </label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {COMMON_ALLERGENS.map(allergen => (
                                        <button
                                            key={allergen}
                                            type="button"
                                            onClick={() => {
                                                const current = editingProduct.allergens || [];
                                                const updated = current.includes(allergen)
                                                    ? current.filter(a => a !== allergen)
                                                    : [...current, allergen];
                                                setEditingProduct({ ...editingProduct, allergens: updated });
                                            }}
                                            className={cn(
                                                "px-3 py-1 rounded-full text-sm font-medium border-2 transition-colors",
                                                editingProduct.allergens?.includes(allergen)
                                                    ? "bg-amber-100 border-amber-400 text-amber-800"
                                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                            )}
                                        >
                                            {allergen}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pairings - Product Selector */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold flex items-center gap-2">
                                        <Wine className="h-4 w-4 text-purple-500" />
                                        Drink Pairings
                                    </label>
                                    <p className="text-xs text-muted-foreground mb-2">Select products that pair well as drinks</p>
                                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                                        {products.filter(p => p.id !== editingProduct.id && p.category?.toLowerCase().includes('drink')).length > 0 ? (
                                            products.filter(p => p.id !== editingProduct.id && p.category?.toLowerCase().includes('drink')).map(p => (
                                                <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={editingProduct.pairings?.drinks?.includes(p.name.en) || false}
                                                        onChange={(e) => {
                                                            const currentDrinks = editingProduct.pairings?.drinks || [];
                                                            const newDrinks = e.target.checked
                                                                ? [...currentDrinks, p.name.en]
                                                                : currentDrinks.filter(d => d !== p.name.en);
                                                            setEditingProduct({
                                                                ...editingProduct,
                                                                pairings: {
                                                                    drinks: newDrinks,
                                                                    foods: editingProduct.pairings?.foods || []
                                                                }
                                                            });
                                                        }}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <span className="text-sm">{p.name.en}</span>
                                                    <span className="text-xs text-muted-foreground ml-auto">${p.price}</span>
                                                </label>
                                            ))
                                        ) : (
                                            <div className="text-sm text-muted-foreground p-2">
                                                <p>No drink products found.</p>
                                                <Textarea
                                                    className="mt-2"
                                                    value={editingProduct.pairings?.drinks?.join(', ') || ''}
                                                    onChange={e => setEditingProduct({
                                                        ...editingProduct,
                                                        pairings: {
                                                            drinks: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                                                            foods: editingProduct.pairings?.foods || []
                                                        }
                                                    })}
                                                    placeholder="Type drink names manually..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {editingProduct.pairings?.drinks && editingProduct.pairings.drinks.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {editingProduct.pairings.drinks.map((drink, i) => (
                                                <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center gap-1">
                                                    {drink}
                                                    <X className="h-3 w-3 cursor-pointer" onClick={() => {
                                                        setEditingProduct({
                                                            ...editingProduct,
                                                            pairings: {
                                                                drinks: editingProduct.pairings?.drinks?.filter(d => d !== drink) || [],
                                                                foods: editingProduct.pairings?.foods || []
                                                            }
                                                        });
                                                    }} />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-bold flex items-center gap-2">
                                        <Utensils className="h-4 w-4 text-green-500" />
                                        Food Pairings
                                    </label>
                                    <p className="text-xs text-muted-foreground mb-2">Select products that pair well as sides</p>
                                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                                        {products.filter(p => p.id !== editingProduct.id && !p.category?.toLowerCase().includes('drink')).slice(0, 15).map(p => (
                                            <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editingProduct.pairings?.foods?.includes(p.name.en) || false}
                                                    onChange={(e) => {
                                                        const currentFoods = editingProduct.pairings?.foods || [];
                                                        const newFoods = e.target.checked
                                                            ? [...currentFoods, p.name.en]
                                                            : currentFoods.filter(f => f !== p.name.en);
                                                        setEditingProduct({
                                                            ...editingProduct,
                                                            pairings: {
                                                                drinks: editingProduct.pairings?.drinks || [],
                                                                foods: newFoods
                                                            }
                                                        });
                                                    }}
                                                    className="rounded border-gray-300"
                                                />
                                                <span className="text-sm">{p.name.en}</span>
                                                <span className="text-xs text-muted-foreground ml-auto">${p.price}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {editingProduct.pairings?.foods && editingProduct.pairings.foods.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {editingProduct.pairings.foods.map((food, i) => (
                                                <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                                                    {food}
                                                    <X className="h-3 w-3 cursor-pointer" onClick={() => {
                                                        setEditingProduct({
                                                            ...editingProduct,
                                                            pairings: {
                                                                drinks: editingProduct.pairings?.drinks || [],
                                                                foods: editingProduct.pairings?.foods?.filter(f => f !== food) || []
                                                            }
                                                        });
                                                    }} />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="text-sm font-bold">Product Image</label>
                                <div className="mt-2">
                                    <ImageUploader
                                        restaurantId={restaurantId}
                                        imageType="product"
                                        currentImageUrl={editingProduct.imageUrl}
                                        onUploadComplete={(imageUrl, imageId) => {
                                            setEditingProduct({ ...editingProduct, imageUrl, imageId });
                                        }}
                                        onUploadError={(error) => console.error('Upload error:', error)}
                                        aspectRatio="16:9"
                                        className="max-w-md"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                                <Button onClick={() => {
                                    if (editingProduct.id) {
                                        onUpdateProduct(editingProduct);
                                    } else {
                                        onAddProduct({ ...editingProduct, id: Date.now().toString() } as Product);
                                    }
                                    setEditingProduct(null);
                                }}>Save Product</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
