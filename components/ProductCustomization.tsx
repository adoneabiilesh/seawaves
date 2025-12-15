'use client';

import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Product, ProductCategory } from '../types';
import { cn } from '@/lib/utils';

export interface Addon {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  available: boolean;
}

interface ProductCustomizationProps {
  products: Product[];
  categories: Category[];
  addons: Addon[];
  onUpdateProduct: (product: Product) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onAddAddon: (addon: Addon) => void;
  onUpdateAddon: (addon: Addon) => void;
  onDeleteAddon: (id: string) => void;
}

export const ProductCustomization: React.FC<ProductCustomizationProps> = ({
  products,
  categories,
  addons,
  onUpdateProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddAddon,
  onUpdateAddon,
  onDeleteAddon,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'addons'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', displayOrder: categories.length });
  const [newAddon, setNewAddon] = useState({ name: '', price: 0, category: '', available: true });

  const handleSaveProduct = () => {
    if (editingProduct) {
      onUpdateProduct(editingProduct);
      setEditingProduct(null);
    }
  };

  const handleSaveCategory = () => {
    if (editingCategory) {
      onUpdateCategory(editingCategory);
      setEditingCategory(null);
    } else {
      const category: Category = {
        id: Date.now().toString(),
        ...newCategory,
        available: true,
      };
      onAddCategory(category);
      setNewCategory({ name: '', description: '', displayOrder: categories.length });
    }
  };

  const handleSaveAddon = () => {
    if (editingAddon) {
      onUpdateAddon(editingAddon);
      setEditingAddon(null);
    } else {
      const addon: Addon = {
        id: Date.now().toString(),
        ...newAddon,
      };
      onAddAddon(addon);
      setNewAddon({ name: '', price: 0, category: '', available: true });
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#111111]">
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
            activeTab === 'products'
              ? "border-[#111111] text-[#111111] font-bold"
              : "border-transparent text-[#111111]/50 hover:text-[#111111]"
          )}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={cn(
            "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
            activeTab === 'categories'
              ? "border-[#111111] text-[#111111] font-bold"
              : "border-transparent text-[#111111]/50 hover:text-[#111111]"
          )}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('addons')}
          className={cn(
            "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
            activeTab === 'addons'
              ? "border-[#111111] text-[#111111] font-bold"
              : "border-transparent text-[#111111]/50 hover:text-[#111111]"
          )}
        >
          Add-ons
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="border border-[#111111]">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#111111]">{product.name.en}</h3>
                    <p className="text-xs text-[#111111]/50">{product.category}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingProduct(product)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm font-bold text-[#111111]">${product.price.toFixed(2)}</div>
                <div className="flex gap-2">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    product.available ? "bg-[#111111] text-[#FFFFFE]" : "bg-[#FFFFFE] text-[#111111] border border-[#111111]"
                  )}>
                    {product.available ? 'Available' : 'Hidden'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-[#FFFFFE] text-[#111111] border border-[#111111]">
                    Stock: {product.stock}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <Card className="border border-[#111111]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" /> Add New Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Category Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                rows={2}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Display Order"
                  value={newCategory.displayOrder}
                  onChange={(e) => setNewCategory({ ...newCategory, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-32"
                />
                <Button onClick={handleSaveCategory} className="flex-1">
                  Add Category
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="border border-[#111111]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#111111]">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-[#111111]/70 mt-1">{category.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs text-[#111111]/50">Order: {category.displayOrder}</span>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded",
                          category.available ? "bg-[#111111] text-[#FFFFFE]" : "bg-[#FFFFFE] text-[#111111] border border-[#111111]"
                        )}>
                          {category.available ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add-ons Tab */}
      {activeTab === 'addons' && (
        <div className="space-y-4">
          <Card className="border border-[#111111]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" /> Add New Add-on
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Add-on Name"
                value={newAddon.name}
                onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Price"
                  value={newAddon.price}
                  onChange={(e) => setNewAddon({ ...newAddon, price: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  placeholder="Category"
                  value={newAddon.category}
                  onChange={(e) => setNewAddon({ ...newAddon, category: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveAddon} className="w-full">
                Add Add-on
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addons.map((addon) => (
              <Card key={addon.id} className="border border-[#111111]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#111111]">{addon.name}</h3>
                      <p className="text-sm font-bold text-[#111111] mt-1">${addon.price.toFixed(2)}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs text-[#111111]/50">{addon.category}</span>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded",
                          addon.available ? "bg-[#111111] text-[#FFFFFE]" : "bg-[#FFFFFE] text-[#111111] border border-[#111111]"
                        )}>
                          {addon.available ? 'Available' : 'Hidden'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingAddon(addon)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteAddon(addon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modals */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#111111]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit Product</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditingProduct(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-2">Name (English)</label>
                <Input
                  value={editingProduct.name.en}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    name: { ...editingProduct.name, en: e.target.value }
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">Price</label>
                  <Input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">Stock</label>
                  <Input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      stock: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProduct}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};





