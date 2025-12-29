'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db';
import { SharedCartItem } from '@/hooks/useSharedCart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Check, X, Send, CreditCard, Users, Clock,
    ChefHat, Eye, DollarSign, AlertCircle, RefreshCw, ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TableWithSession {
    tableNumber: number;
    sessionId: string;
    startedAt: string;
    guestCount: number;
    items: SharedCartItem[];
    totalAmount: number;
    paymentRequested: boolean;
}

export const TableOrdersPanel: React.FC<{ restaurantId: string }> = ({ restaurantId }) => {
    const [tables, setTables] = useState<TableWithSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState<number | null>(null);

    // Fetch active table sessions with their cart items
    const fetchTables = useCallback(async () => {
        try {
            const { data: sessions, error: sessionError } = await supabase
                .from('TableSession')
                .select(`
                    id,
                    tableNumber,
                    startedAt,
                    guestCount,
                    paymentRequested,
                    totalAmount
                `)
                .eq('restaurantId', restaurantId)
                .eq('status', 'active')
                .order('tableNumber');

            if (sessionError) throw sessionError;

            // Fetch cart items for each session
            const tablesWithItems: TableWithSession[] = await Promise.all(
                (sessions || []).map(async (session: { id: string; tableNumber: number; startedAt: string; guestCount: number; paymentRequested: boolean; totalAmount: number }) => {
                    const { data: items } = await supabase
                        .from('SharedCartItem')
                        .select('*, product:Product(*)')
                        .eq('tableSessionId', session.id)
                        .neq('status', 'cancelled')
                        .order('createdAt');

                    const totalAmount = (items || []).reduce((sum: number, item: { product?: { price?: number }; quantity: number }) => {
                        const price = item.product?.price || 0;
                        return sum + (price * item.quantity);
                    }, 0);

                    return {
                        tableNumber: session.tableNumber,
                        sessionId: session.id,
                        startedAt: session.startedAt,
                        guestCount: session.guestCount,
                        items: items || [],
                        totalAmount,
                        paymentRequested: session.paymentRequested || false
                    };
                })
            );

            setTables(tablesWithItems);
        } catch (err) {
            console.error('Failed to fetch tables:', err);
        } finally {
            setIsLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        fetchTables();
        // Refresh every 10 seconds
        const interval = setInterval(fetchTables, 10000);
        return () => clearInterval(interval);
    }, [fetchTables]);

    // Verify item (manager approves)
    const verifyItem = async (itemId: string) => {
        await supabase
            .from('SharedCartItem')
            .update({ status: 'verified', verifiedAt: new Date().toISOString() })
            .eq('id', itemId);
        toast.success('Item verified');
        fetchTables();
    };

    // Verify all pending items for a table
    const verifyAllItems = async (sessionId: string) => {
        await supabase
            .from('SharedCartItem')
            .update({ status: 'verified', verifiedAt: new Date().toISOString() })
            .eq('tableSessionId', sessionId)
            .eq('status', 'pending');
        toast.success('All items verified');
        fetchTables();
    };

    // Send verified items to kitchen
    const sendToKitchen = async (sessionId: string) => {
        const { data: items } = await supabase
            .from('SharedCartItem')
            .select('*, product:Product(*)')
            .eq('tableSessionId', sessionId)
            .eq('status', 'verified');

        if (!items || items.length === 0) {
            toast.error('No verified items to send');
            return;
        }

        // Get table info
        const { data: session } = await supabase
            .from('TableSession')
            .select('tableNumber, restaurantId')
            .eq('id', sessionId)
            .single();

        if (!session) return;

        // Create order
        const totalPrice = items.reduce((sum: number, item: { product?: { price?: number }; quantity: number }) =>
            sum + ((item.product?.price || 0) * item.quantity), 0
        );

        const { data: order, error: orderError } = await supabase
            .from('Order')
            .insert({
                restaurantId: session.restaurantId,
                tableNumber: session.tableNumber,
                tableSessionId: sessionId,
                status: 'pending',
                total: totalPrice,
                paymentMode: 'pay_later',
                orderNumber: `ORD-${Date.now()}`
            })
            .select()
            .single();

        if (orderError) {
            toast.error('Failed to create order');
            return;
        }

        // Create order items
        const orderItems = items.map((item: { productId: string; quantity: number; notes?: string; product?: { price?: number } }) => ({
            orderId: order.id,
            menuItemId: item.productId,
            quantity: item.quantity,
            price: item.product?.price || 0,
            notes: item.notes
        }));

        await supabase.from('OrderItem').insert(orderItems);

        // Update cart items status
        await supabase
            .from('SharedCartItem')
            .update({ status: 'sent_to_kitchen' })
            .eq('tableSessionId', sessionId)
            .eq('status', 'verified');

        toast.success('Order sent to kitchen!');
        fetchTables();
    };

    // Request payment
    const requestPayment = async (sessionId: string) => {
        await supabase
            .from('TableSession')
            .update({
                paymentRequested: true,
                paymentRequestedAt: new Date().toISOString()
            })
            .eq('id', sessionId);
        toast.success('Payment request sent to guests');
        fetchTables();
    };

    // Cancel item
    const cancelItem = async (itemId: string) => {
        await supabase
            .from('SharedCartItem')
            .update({ status: 'cancelled' })
            .eq('id', itemId);
        toast.info('Item cancelled');
        fetchTables();
    };

    const selectedTableData = tables.find(t => t.tableNumber === selectedTable);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            {/* Table List */}
            <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Active Tables</h3>
                    <Button variant="outline" size="sm" onClick={fetchTables}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                {tables.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="text-center py-12 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No active tables</p>
                        </CardContent>
                    </Card>
                ) : (
                    tables.map(table => (
                        <Card
                            key={table.tableNumber}
                            className={cn(
                                "border-2 cursor-pointer transition-all hover:shadow-md",
                                selectedTable === table.tableNumber
                                    ? "border-black shadow-[4px_4px_0px_0px_black]"
                                    : "border-gray-200"
                            )}
                            onClick={() => setSelectedTable(table.tableNumber)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-black text-2xl">Table {table.tableNumber}</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-bold",
                                        table.paymentRequested
                                            ? "bg-red-100 text-red-700"
                                            : "bg-gray-100 text-gray-700"
                                    )}>
                                        {table.paymentRequested ? 'Payment Pending' : 'Active'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {table.guestCount || new Set(table.items.map(i => i.guestId)).size}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ShoppingBag className="h-4 w-4" />
                                        {table.items.length} items
                                    </span>
                                    <span className="font-bold text-black">
                                        ${table.totalAmount.toFixed(2)}
                                    </span>
                                </div>
                                {table.items.filter(i => i.status === 'pending').length > 0 && (
                                    <div className="mt-2 flex items-center gap-1 text-amber-600 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        {table.items.filter(i => i.status === 'pending').length} pending verification
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Selected Table Detail */}
            <div className="lg:col-span-2">
                {selectedTableData ? (
                    <Card className="border-2 border-black shadow-[6px_6px_0px_0px_black]">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Table {selectedTableData.tableNumber} Orders</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => verifyAllItems(selectedTableData.sessionId)}
                                        disabled={selectedTableData.items.filter(i => i.status === 'pending').length === 0}
                                    >
                                        <Check className="h-4 w-4 mr-1" />
                                        Verify All
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => sendToKitchen(selectedTableData.sessionId)}
                                        disabled={selectedTableData.items.filter(i => i.status === 'verified').length === 0}
                                    >
                                        <Send className="h-4 w-4 mr-1" />
                                        Send to Kitchen
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => requestPayment(selectedTableData.sessionId)}
                                        disabled={selectedTableData.paymentRequested}
                                    >
                                        <CreditCard className="h-4 w-4 mr-1" />
                                        Request Payment
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {selectedTableData.items.map(item => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-center gap-4 p-3 rounded-lg border-2",
                                            item.status === 'pending' && "border-amber-300 bg-amber-50",
                                            item.status === 'verified' && "border-green-300 bg-green-50",
                                            item.status === 'sent_to_kitchen' && "border-blue-300 bg-blue-50"
                                        )}
                                    >
                                        {/* Guest color indicator */}
                                        <div
                                            className="w-3 h-12 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: item.guestColor }}
                                            title={item.guestName}
                                        />

                                        {/* Product image */}
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                            {item.product?.imageUrl && (
                                                <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>

                                        {/* Item details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold truncate">{item.product?.name?.en}</span>
                                                <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">x{item.quantity}</span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                by {item.guestName}
                                                {item.notes && <span className="ml-2 italic">– {item.notes}</span>}
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <span className="font-bold">
                                            ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                                        </span>

                                        {/* Status badge */}
                                        <span
                                            className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold",
                                                item.status === 'pending' && "bg-gray-100 text-gray-700",
                                                item.status === 'verified' && "bg-green-100 text-green-700",
                                                item.status === 'sent_to_kitchen' && "bg-blue-100 text-blue-700"
                                            )}
                                        >
                                            {item.status === 'sent_to_kitchen' ? 'In Kitchen' : item.status}
                                        </span>

                                        {/* Actions */}
                                        {item.status === 'pending' && (
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" onClick={() => verifyItem(item.id)}>
                                                    <Check className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => cancelItem(item.id)}>
                                                    <X className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {selectedTableData.items.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No orders yet from this table</p>
                                    </div>
                                )}
                            </div>

                            {/* Total */}
                            <div className="mt-6 pt-4 border-t-2 flex items-center justify-between">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-black text-2xl text-[#DC143C]">
                                    ${selectedTableData.totalAmount.toFixed(2)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-2 border-dashed h-full flex items-center justify-center">
                        <CardContent className="text-center py-16 text-gray-500">
                            <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Select a table to view orders</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
