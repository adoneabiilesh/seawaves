'use client';

import React, { useState } from 'react';
import { Order, OrderStatus } from '@/types';
import { Clock, CheckCircle2, ChefHat, Bell, AlertTriangle, Printer, Filter, Flame } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { useApp } from '@/app/providers';

interface KitchenDisplayProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ orders, onUpdateStatus }) => {
  const { products } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'cooking' | 'ready'>('all');

  const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);

  const displayedOrders = activeOrders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'pending') return o.status === OrderStatus.PENDING;
    if (filter === 'cooking') return o.status === OrderStatus.PREPARING;
    if (filter === 'ready') return o.status === OrderStatus.READY;
    return true;
  });

  const getProductAllergens = (productName: string) => {
    const prod = products.find(p => p.name.en === productName || (typeof p.name === 'string' && p.name === productName));
    return prod?.allergens || [];
  };

  return (
    <div className="p-4 sm:p-6 bg-[#FFFFF0] min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-4 border-black pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-3 border-2 border-black shadow-[4px_4px_0px_0px_#DC143C]">
            <Flame size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Kitchen KDS</h1>
            <p className="text-black/60 text-xs font-bold uppercase tracking-widest">Level 1 • Live Prep Stream</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-white border-2 border-black p-1 w-full md:w-auto">
            {['all', 'pending', 'cooking', 'ready'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all flex-1 md:flex-none",
                  filter === f ? "bg-black text-white" : "hover:bg-gray-100"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border-4 border-dashed border-black/10 rounded-3xl">
          <ChefHat size={64} className="text-black/5 mb-4" />
          <p className="text-black/20 font-black uppercase text-2xl">Kitchen is Clear</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedOrders.map(order => (
            <Card key={order.id} className={cn(
              "border-4 border-black shadow-[6px_6px_0px_0px_black] transition-all flex flex-col",
              order.status === OrderStatus.READY && "opacity-60 bg-gray-50",
              order.status === OrderStatus.PREPARING && "ring-4 ring-[#DC143C] ring-inset"
            )}>
              <CardHeader className="border-b-4 border-black p-4 bg-white space-y-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-black uppercase text-black/40">Table</div>
                    <div className="text-4xl font-black">{order.tableNumber || '--'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-black/40">Order #{order.id.slice(-4)}</div>
                    <div className="flex items-center gap-1 font-bold text-xs mt-1">
                      <Clock size={12} /> {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 flex-1 space-y-4 bg-white/50">
                <div className="space-y-3">
                  {order.items.map((item, idx) => {
                    const allergens = getProductAllergens(item.name.en || item.name);
                    return (
                      <div key={idx} className="p-3 border-2 border-black bg-white rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-black text-black uppercase leading-tight">{item.name.en || item.name}</div>
                            {allergens.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {allergens.map(a => (
                                  <span key={a} className="bg-red-600 text-white text-[8px] font-black px-1 uppercase flex items-center gap-0.5">
                                    <AlertTriangle size={8} /> {a}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="bg-black text-white w-8 h-8 flex items-center justify-center font-black text-lg ml-2">
                            {item.quantity}
                          </div>
                        </div>
                        {item.specialRequest && (
                          <div className="mt-2 text-[10px] font-bold text-[#DC143C] uppercase bg-red-50 p-1 border border-red-100 italic">
                            "{item.specialRequest}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {order.specialRequests && (
                  <div className="p-3 bg-black text-white text-xs font-bold uppercase italic leading-tight rounded">
                    <span className="text-red-400 font-black mb-1 block">TICKET NOTE:</span>
                    {order.specialRequests}
                  </div>
                )}
              </CardContent>

              <div className="p-4 bg-white border-t-4 border-black">
                <div className="grid grid-cols-2 gap-2">
                  {order.status === OrderStatus.PENDING && (
                    <Button
                      onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)}
                      className="bg-black text-white border-2 border-black font-black uppercase text-xs h-12 shadow-[3px_3px_0px_0px_#DC143C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      Start Cooking
                    </Button>
                  )}
                  {order.status === OrderStatus.PREPARING && (
                    <Button
                      onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
                      className="bg-[#DC143C] text-white border-2 border-black font-black uppercase text-xs h-12 shadow-[3px_3px_0px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      Push to Ready
                    </Button>
                  )}
                  {order.status === OrderStatus.READY && (
                    <Button
                      variant="outline"
                      onClick={() => onUpdateStatus(order.id, OrderStatus.PENDING)}
                      className="border-2 border-black font-black uppercase text-xs h-12 shadow-[3px_3px_0px_0px_black]"
                    >
                      Recall
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => alert("Printing Ticket...")}
                    className="border-2 border-black font-black uppercase text-xs h-12 shadow-[3px_3px_0px_0px_gray]"
                  >
                    <Printer size={16} className="mr-2" /> Print
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
