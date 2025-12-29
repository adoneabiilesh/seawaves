'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Banknote, Users, ArrowRight, Check, Loader2 } from 'lucide-react';
import { SharedCartItem } from '@/hooks/useSharedCart';
import { cn } from '@/lib/utils';

interface PaymentRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    tableNumber: number;
    items: SharedCartItem[];
    total: number;
    guestId: string;
    onPaymentComplete?: (method: string) => void;
}

type PaymentMethod = 'counter_cash' | 'counter_card' | 'mobile_stripe' | 'split_bill';

const PAYMENT_OPTIONS = [
    {
        id: 'counter_cash' as PaymentMethod,
        label: 'Pay at Counter',
        sublabel: 'Cash',
        icon: Banknote,
        color: 'bg-green-500'
    },
    {
        id: 'counter_card' as PaymentMethod,
        label: 'Pay at Counter',
        sublabel: 'Card',
        icon: CreditCard,
        color: 'bg-blue-500'
    },
    {
        id: 'mobile_stripe' as PaymentMethod,
        label: 'Pay on Phone',
        sublabel: 'Credit/Debit Card',
        icon: CreditCard,
        color: 'bg-purple-500'
    },
    {
        id: 'split_bill' as PaymentMethod,
        label: 'Split Bill',
        sublabel: 'Pay your items only',
        icon: Users,
        color: 'bg-orange-500'
    }
];

export const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({
    isOpen,
    onClose,
    tableNumber,
    items,
    total,
    guestId,
    onPaymentComplete
}) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Calculate guest's portion for split bill
    const myItems = items.filter(i => i.guestId === guestId);
    const myTotal = myItems.reduce((sum, item) => {
        const price = item.product?.price || 0;
        return sum + (price * item.quantity);
    }, 0);

    // Group items by guest
    const itemsByGuest = items.reduce((acc, item) => {
        if (!acc[item.guestName]) {
            acc[item.guestName] = { items: [], total: 0, color: item.guestColor };
        }
        acc[item.guestName].items.push(item);
        acc[item.guestName].total += (item.product?.price || 0) * item.quantity;
        return acc;
    }, {} as Record<string, { items: SharedCartItem[]; total: number; color: string }>);

    const handlePayment = async () => {
        if (!selectedMethod) return;

        setIsProcessing(true);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (selectedMethod === 'mobile_stripe') {
            // Would integrate with Stripe Checkout here
            // For now, simulate success
        }

        setPaymentSuccess(true);
        setIsProcessing(false);

        if (onPaymentComplete) {
            onPaymentComplete(selectedMethod);
        }

        // Auto-close after success
        setTimeout(() => onClose(), 3000);
    };

    if (paymentSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md">
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-black mb-2">Payment Complete!</h2>
                        <p className="text-gray-600">
                            {selectedMethod?.includes('counter')
                                ? 'Please pay at the counter'
                                : 'Thank you for your payment'}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-center">
                        💳 Payment Requested
                    </DialogTitle>
                    <p className="text-center text-gray-600">Table {tableNumber}</p>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Bill Summary */}
                    <Card className="border-2 border-black">
                        <CardContent className="p-4">
                            <h3 className="font-bold mb-3">Order Summary</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {Object.entries(itemsByGuest).map(([guestName, data]) => (
                                    <div key={guestName}>
                                        <div
                                            className="flex items-center gap-2 text-sm font-bold mb-1"
                                            style={{ color: data.color }}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: data.color }}
                                            />
                                            {guestName}
                                        </div>
                                        {data.items.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm pl-4">
                                                <span>{item.product?.name?.en} x{item.quantity}</span>
                                                <span>${((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t-2 flex justify-between">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-black text-2xl text-[#DC143C]">${total.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Options */}
                    <div>
                        <h3 className="font-bold mb-3">How would you like to pay?</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {PAYMENT_OPTIONS.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setSelectedMethod(option.id)}
                                    className={cn(
                                        "p-4 rounded-xl border-2 text-left transition-all",
                                        selectedMethod === option.id
                                            ? "border-black shadow-[4px_4px_0px_0px_black] -translate-x-[2px] -translate-y-[2px]"
                                            : "border-gray-200 hover:border-gray-400"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", option.color)}>
                                        <option.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="font-bold text-sm">{option.label}</div>
                                    <div className="text-xs text-gray-500">{option.sublabel}</div>
                                    {option.id === 'split_bill' && (
                                        <div className="mt-1 text-xs font-bold text-[#DC143C]">
                                            Your share: ${myTotal.toFixed(2)}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pay Button */}
                    <Button
                        onClick={handlePayment}
                        disabled={!selectedMethod || isProcessing}
                        className="w-full py-6 bg-[#DC143C] text-white font-bold text-lg shadow-[4px_4px_0px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                {selectedMethod === 'split_bill'
                                    ? `Pay $${myTotal.toFixed(2)}`
                                    : `Pay $${total.toFixed(2)}`}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
