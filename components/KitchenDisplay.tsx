'use client';

import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, CheckCircle2, ChefHat, Bell, User, AlertTriangle, Printer, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';

interface KitchenDisplayProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ orders, onUpdateStatus }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'ready'>('all');
  const [showHistory, setShowHistory] = useState(false);

  const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED);
  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
  
  const displayedOrders = showHistory ? deliveredOrders : activeOrders.filter(o => {
      if (filter === 'all') return true;
      if (filter === 'pending') return o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING;
      if (filter === 'ready') return o.status === OrderStatus.READY;
      return true;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
        case OrderStatus.PENDING: return 'bg-[#FFFFFE] text-[#111111] border-[#111111]';
        case OrderStatus.PREPARING: return 'bg-[#111111] text-[#FFFFFE] border-[#111111]';
        case OrderStatus.READY: return 'bg-[#FFFFFE] text-[#111111] border-[#111111] border-2';
        default: return 'bg-[#FFFFFE] text-[#111111] border-[#111111]';
    }
  };

  const handlePrint = (order: Order) => {
      alert(`Printing Ticket #${order.id.slice(-4)}...\nItems: ${order.items.length}\nTable: ${order.tableNumber}`);
  };

  return (
    <div className="p-6 bg-[#FFFFFE] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-[#111111] pb-4 gap-4">
        <div className="flex items-center gap-3">
            <ChefHat size={32} className="text-[#111111]" />
            <div>
                <h1 className="text-3xl font-bold text-[#111111]">Kitchen Display System</h1>
                <p className="text-[#111111]/70 text-sm">Real-time Order Management</p>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex bg-[#FFFFFE] border border-[#111111] rounded-md p-1">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="text-xs"
                >
                    All ({activeOrders.length})
                </Button>
                <Button
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pending')}
                    className="text-xs"
                >
                    Pending
                </Button>
                <Button
                    variant={filter === 'ready' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('ready')}
                    className="text-xs"
                >
                    Ready
                </Button>
            </div>
            <Button
                variant={showHistory ? 'default' : 'outline'}
                onClick={() => setShowHistory(!showHistory)}
                size="sm"
            >
                {showHistory ? 'Active Orders' : 'History'}
            </Button>
        </div>
      </div>

      {displayedOrders.length === 0 ? (
        <Card className="border border-[#111111]">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Bell size={48} className="text-[#111111]/30 mb-4" />
            <p className="text-[#111111]/50 text-lg">No orders to display</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedOrders.map(order => (
            <Card key={order.id} className={cn("border-2 transition-all hover:shadow-lg", 
              order.status === OrderStatus.READY && "border-[#111111] border-2"
            )}>
              <CardHeader className="flex flex-row items-center justify-between border-b border-[#111111] pb-3">
                <div>
                  <CardTitle className="text-xl font-bold text-[#111111]">
                    Order #{order.id.slice(-4)}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <User size={14} className="text-[#111111]/50" />
                    <span className="text-sm text-[#111111]/70">{order.customerName || 'Guest'}</span>
                    {order.tableNumber && (
                      <>
                        <span className="text-[#111111]/30">•</span>
                        <span className="text-sm text-[#111111]/70">Table {order.tableNumber}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={cn("px-3 py-1 rounded-md text-xs font-bold border border-[#111111]", getStatusColor(order.status))}>
                  {order.status}
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between p-2 border border-[#111111]/10 rounded-md">
                      <div className="flex-1">
                        <div className="font-semibold text-[#111111] text-sm">{item.name.en}</div>
                        {item.modifiers.length > 0 && (
                          <div className="text-xs text-[#111111]/50 mt-1">
                            {item.modifiers.map(m => <span key={m} className="mr-2">• {m}</span>)}
                          </div>
                        )}
                        {item.specialRequest && (
                          <div className="text-xs text-[#111111]/50 mt-1 italic">"{item.specialRequest}"</div>
                        )}
                      </div>
                      <span className="font-bold text-[#111111] ml-2">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#111111]/10">
                  <div className="text-lg font-bold text-[#111111]">${order.total.toFixed(2)}</div>
                  <div className="flex gap-2">
                    {order.status === OrderStatus.PENDING && (
                      <Button
                        size="sm"
                        onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)}
                        className="text-xs"
                      >
                        Start
                      </Button>
                    )}
                    {order.status === OrderStatus.PREPARING && (
                      <Button
                        size="sm"
                        onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
                        className="text-xs"
                      >
                        Ready
                      </Button>
                    )}
                    {order.status === OrderStatus.READY && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(order.id, OrderStatus.DELIVERED)}
                        className="text-xs"
                      >
                        Served
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrint(order)}
                      className="text-xs"
                    >
                      <Printer size={14} className="mr-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
