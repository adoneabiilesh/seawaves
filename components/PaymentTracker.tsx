'use client';

import React, { useState } from 'react';
import { CreditCard, Filter, Download, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  tableNumber?: number;
  orderType: 'online' | 'cash' | 'pos';
  customerName: string;
  createdAt: Date;
  platformFee: number;
  restaurantPayout: number;
}

interface PaymentTrackerProps {
  payments: PaymentRecord[];
  onRefund?: (paymentId: string) => void;
}

export const PaymentTracker: React.FC<PaymentTrackerProps> = ({
  payments,
  onRefund,
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === 'all' || payment.status === filter;
    const matchesSearch = searchQuery === '' ||
      payment.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.tableNumber?.toString().includes(searchQuery) ?? false);
    return matchesFilter && matchesSearch;
  });

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.restaurantPayout, 0);

  const totalFees = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.platformFee, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-[#111111] text-[#FFFFFE]';
      case 'pending':
        return 'bg-[#FFFFFE] text-[#111111] border border-[#111111]';
      case 'failed':
        return 'bg-[#FFFFFE] text-[#111111] border border-[#111111]';
      case 'refunded':
        return 'bg-[#FFFFFE] text-[#111111]/50 border border-[#111111]/30';
      default:
        return 'bg-[#FFFFFE] text-[#111111] border border-[#111111]';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-[#111111]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#111111]/70">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111111]">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-[#111111]/50 mt-1">
              {payments.filter(p => p.status === 'completed').length} completed payments
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#111111]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#111111]/70">Platform Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111111]">
              ${totalFees.toFixed(2)}
            </div>
            <p className="text-xs text-[#111111]/50 mt-1">Total fees deducted</p>
          </CardContent>
        </Card>

        <Card className="border border-[#111111]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#111111]/70">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111111]">
              {payments.filter(p => p.status === 'pending').length}
            </div>
            <p className="text-xs text-[#111111]/50 mt-1">Awaiting completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border border-[#111111]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#111111]/50" />
              <Input
                placeholder="Search by order number, customer, or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 border border-[#111111] rounded-md p-1">
              {(['all', 'completed', 'pending', 'failed', 'refunded'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className="text-xs capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Payments List */}
          <div className="space-y-2">
            {filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-[#111111]/50">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-[#111111]">
                    <tr>
                      <th className="text-left p-3 font-semibold text-[#111111]">Order</th>
                      <th className="text-left p-3 font-semibold text-[#111111]">Customer</th>
                      <th className="text-left p-3 font-semibold text-[#111111]">Method</th>
                      <th className="text-right p-3 font-semibold text-[#111111]">Amount</th>
                      <th className="text-right p-3 font-semibold text-[#111111]">Payout</th>
                      <th className="text-left p-3 font-semibold text-[#111111]">Status</th>
                      <th className="text-left p-3 font-semibold text-[#111111]">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111111]/10">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-[#111111]/5">
                        <td className="p-3">
                          <div className="font-semibold text-[#111111]">#{payment.orderNumber}</div>
                          {payment.tableNumber && (
                            <div className="text-xs text-[#111111]/50">Table {payment.tableNumber}</div>
                          )}
                        </td>
                        <td className="p-3 text-[#111111]">{payment.customerName}</td>
                        <td className="p-3 text-[#111111]">{payment.paymentMethod}</td>
                        <td className="p-3 text-right font-semibold text-[#111111]">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-[#111111]">
                          ${payment.restaurantPayout.toFixed(2)}
                          <div className="text-xs text-[#111111]/50">
                            Fee: ${payment.platformFee.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-bold",
                            getStatusColor(payment.status)
                          )}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="p-3 text-[#111111]/70 text-xs">
                          {formatDate(payment.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};





