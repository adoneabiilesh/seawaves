'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, RefreshCw, TrendingDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { useApp } from '@/app/providers';
import { supabase } from '@/lib/supabase-client';
import { Product } from '@/types';

interface LowStockProduct {
    id: string;
    name: { en: string };
    stock: number;
    category: string;
    imageUrl?: string;
}

interface InventoryAlertsProps {
    threshold?: number; // Default 10
}

export const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ threshold = 10 }) => {
    const { restaurantId } = useApp();
    const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([]);
    const [outOfStockItems, setOutOfStockItems] = useState<LowStockProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchInventory = async () => {
        if (!restaurantId) return;

        setIsLoading(true);
        try {
            // Fetch all products for this restaurant
            const { data: products, error } = await supabase
                .from('Product')
                .select('id, name, stock, category, imageUrl')
                .eq('restaurantId', restaurantId)
                .order('stock', { ascending: true });

            if (!error && products) {
                const outOfStock: LowStockProduct[] = [];
                const lowStock: LowStockProduct[] = [];

                products.forEach((p: any) => {
                    if (p.stock <= 0) {
                        outOfStock.push(p);
                    } else if (p.stock <= threshold) {
                        lowStock.push(p);
                    }
                });

                setOutOfStockItems(outOfStock);
                setLowStockItems(lowStock);
            }
        } catch (err) {
            console.error('Error fetching inventory:', err);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInventory();
        // Refresh every 5 minutes
        const interval = setInterval(fetchInventory, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [restaurantId, threshold]);

    const updateStock = async (productId: string, newStock: number) => {
        const { error } = await supabase
            .from('Product')
            .update({ stock: newStock })
            .eq('id', productId);

        if (!error) {
            fetchInventory();
        }
    };

    const totalAlerts = outOfStockItems.length + lowStockItems.length;

    if (totalAlerts === 0 && !isLoading) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="font-bold text-green-800">Inventory OK</p>
                        <p className="text-sm text-green-600">All items are well stocked</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={outOfStockItems.length > 0 ? "border-red-200" : "border-yellow-200"}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-5 w-5 ${outOfStockItems.length > 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                        <CardTitle className="text-lg">Inventory Alerts</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={fetchInventory} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <CardDescription>
                    {totalAlerts} item{totalAlerts !== 1 ? 's' : ''} need attention
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Out of Stock Section */}
                {outOfStockItems.length > 0 && (
                    <div>
                        <h4 className="font-bold text-red-800 text-sm uppercase mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Out of Stock ({outOfStockItems.length})
                        </h4>
                        <div className="space-y-2">
                            {outOfStockItems.slice(0, 5).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                                >
                                    <div className="flex items-center gap-3">
                                        {item.imageUrl && (
                                            <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {typeof item.name === 'object' ? item.name.en : item.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            defaultValue={0}
                                            className="w-16 px-2 py-1 border rounded text-sm"
                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (val > 0) updateStock(item.id, val);
                                            }}
                                            placeholder="Qty"
                                        />
                                        <Button size="sm" variant="outline" onClick={() => updateStock(item.id, 10)}>
                                            +10
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {outOfStockItems.length > 5 && (
                                <p className="text-sm text-gray-500 text-center">
                                    +{outOfStockItems.length - 5} more items
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Low Stock Section */}
                {lowStockItems.length > 0 && (
                    <div>
                        <h4 className="font-bold text-yellow-800 text-sm uppercase mb-2 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Low Stock ({lowStockItems.length})
                        </h4>
                        <div className="space-y-2">
                            {lowStockItems.slice(0, 5).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                                >
                                    <div className="flex items-center gap-3">
                                        {item.imageUrl && (
                                            <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {typeof item.name === 'object' ? item.name.en : item.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-yellow-700">
                                            {item.stock} left
                                        </span>
                                        <Button size="sm" variant="outline" onClick={() => updateStock(item.id, item.stock + 20)}>
                                            +20
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {lowStockItems.length > 5 && (
                                <p className="text-sm text-gray-500 text-center">
                                    +{lowStockItems.length - 5} more items
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
