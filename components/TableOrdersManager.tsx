'use client';

import React, { useState } from 'react';
import { Table, Clock, CreditCard, X, CheckCircle2, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export interface TableOrder {
  id: string;
  tableNumber: number;
  sessionId: string;
  orders: Array<{
    id: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    status: 'pending' | 'preparing' | 'ready' | 'served';
    createdAt: Date;
    paymentStatus: 'unpaid' | 'paid' | 'partial';
  }>;
  totalAmount: number;
  paidAmount: number;
  startedAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

interface TableOrdersManagerProps {
  tableOrders: TableOrder[];
  onCloseTable: (tableNumber: number) => void;
  onViewOrder: (orderId: string) => void;
}

export const TableOrdersManager: React.FC<TableOrdersManagerProps> = ({
  tableOrders,
  onCloseTable,
  onViewOrder,
}) => {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  const activeTables = tableOrders.filter(to => to.isActive);
  const selectedTableOrder = activeTables.find(to => to.tableNumber === selectedTable);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#FFFFFE] text-[#111111] border-[#111111]';
      case 'preparing':
        return 'bg-[#111111] text-[#FFFFFE] border-[#111111]';
      case 'ready':
        return 'bg-[#FFFFFE] text-[#111111] border-[#111111] border-2';
      case 'served':
        return 'bg-[#FFFFFE] text-[#111111]/50 border-[#111111]/30';
      default:
        return 'bg-[#FFFFFE] text-[#111111] border-[#111111]';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-[#111111] text-[#FFFFFE]';
      case 'partial':
        return 'bg-[#FFFFFE] text-[#111111] border border-[#111111]';
      default:
        return 'bg-[#FFFFFE] text-[#111111] border border-[#111111]';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Active Tables List */}
      <Card className="lg:col-span-1 border border-[#111111]">
        <CardHeader className="border-b border-[#111111]">
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" /> Active Tables
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#111111]/10">
            {activeTables.length === 0 ? (
              <div className="p-8 text-center text-[#111111]/50">
                <Table className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No active tables</p>
              </div>
            ) : (
              activeTables.map((tableOrder) => (
                <button
                  key={tableOrder.tableNumber}
                  onClick={() => setSelectedTable(tableOrder.tableNumber)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-[#111111]/5 transition-colors",
                    selectedTable === tableOrder.tableNumber && "bg-[#111111]/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#111111]">Table {tableOrder.tableNumber}</div>
                      <div className="text-xs text-[#111111]/50 mt-1">
                        {tableOrder.orders.length} order{tableOrder.orders.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#111111]">
                        ${tableOrder.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#111111]/50">
                        {tableOrder.paidAmount > 0 && (
                          <span className="text-[#111111]">
                            Paid: ${tableOrder.paidAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-[#111111]/50">
                    <Clock className="h-3 w-3" />
                    {formatTime(tableOrder.lastActivity)}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table Details */}
      {selectedTableOrder && (
        <Card className="lg:col-span-2 border border-[#111111]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#111111]">
            <div>
              <CardTitle>Table {selectedTableOrder.tableNumber} - Orders</CardTitle>
              <div className="text-sm text-[#111111]/70 mt-1">
                Started: {formatTime(selectedTableOrder.startedAt)}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => onCloseTable(selectedTableOrder.tableNumber)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" /> Close Table
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTableOrder.orders.map((order) => (
              <div
                key={order.id}
                className="border border-[#111111] rounded-md p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4 text-[#111111]/50" />
                    <div>
                      <div className="font-semibold text-[#111111]">Order #{order.id.slice(-6)}</div>
                      <div className="text-xs text-[#111111]/50">
                        {formatTime(order.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-bold border",
                      getStatusColor(order.status)
                    )}>
                      {order.status}
                    </span>
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-bold",
                      getPaymentStatusColor(order.paymentStatus)
                    )}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-[#111111]">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-[#111111] font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#111111]/10">
                  <div className="font-bold text-[#111111]">
                    Total: ${order.total.toFixed(2)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewOrder(order.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-[#111111]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-[#111111]/70">Total Amount</div>
                  <div className="text-2xl font-bold text-[#111111]">
                    ${selectedTableOrder.totalAmount.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#111111]/70">Paid</div>
                  <div className="text-xl font-semibold text-[#111111]">
                    ${selectedTableOrder.paidAmount.toFixed(2)}
                  </div>
                </div>
              </div>
              {selectedTableOrder.paidAmount >= selectedTableOrder.totalAmount && (
                <Button
                  onClick={() => onCloseTable(selectedTableOrder.tableNumber)}
                  className="w-full flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" /> Close Table & Complete Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};





