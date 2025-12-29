
import React, { useState } from 'react';
import { CartItem, RestaurantSettings } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, CreditCard, Wallet, DollarSign, Smartphone, MapPin, UtensilsCrossed, Truck } from 'lucide-react';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    onRemoveItem: (productId: string) => void;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onCheckout: (details: { paymentMethod: string, email: string }) => void;
    settings: RestaurantSettings;
    orderMode?: 'dine_in' | 'delivery' | 'takeout' | null;
    tableNumber?: number | null;
    onOrderModeChange?: (mode: 'dine_in' | 'delivery' | 'takeout') => void;
    onTableNumberChange?: (table: number | null) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen,
    onClose,
    items,
    onRemoveItem,
    onUpdateQuantity,
    onCheckout,
    settings,
    orderMode = 'dine_in',
    tableNumber,
    onOrderModeChange,
    onTableNumberChange
}) => {
    const [step, setStep] = useState<'cart' | 'checkout'>('cart');
    const [email, setEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash' | 'Apple Pay' | 'Google Pay' | 'PayPal' | 'Venmo' | 'Zelle'>('Card');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [localTableNumber, setLocalTableNumber] = useState<number | null>(tableNumber || null);

    const subtotal = (items || []).reduce((sum, item) => {
        const itemPrice = item.product?.price || 0;
        const addonsPrice = item.addons?.reduce((a, addon) => a + (addon.price || 0), 0) || 0;
        return sum + ((itemPrice + addonsPrice) * item.quantity);
    }, 0);
    const tax = subtotal * ((settings?.taxRate || 10) / 100);
    const total = subtotal + tax;

    if (!isOpen) return null;

    const handleCheckout = () => {
        onCheckout({ paymentMethod, email });
        setStep('cart'); // Reset for next time
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="text-brand-500" />
                        <h2 className="text-xl font-bold text-gray-900">
                            {step === 'cart' ? 'Your Order' : 'Secure Checkout'}
                        </h2>
                        {step === 'cart' && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm font-medium">
                                {items.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {step === 'cart' ? (
                    <>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                    <ShoppingBag size={48} className="opacity-20" />
                                    <p className="text-center">Your order is empty.</p>
                                    <button onClick={onClose} className="text-brand-600 font-medium hover:underline">Go to Menu</button>
                                </div>
                            ) : (
                                items.map((item, idx) => (
                                    <div key={`${item.product?.id}-${idx}`} className="flex gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 group relative">
                                        <img src={item.product?.imageUrl || '/placeholder.png'} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-200" />
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 line-clamp-1">{item.product?.name?.en || 'Item'}</h4>
                                                <p className="text-brand-600 font-medium text-sm">{settings?.currency || '$'}{(item.product?.price || 0).toFixed(2)}</p>
                                            </div>
                                            {/* Addons & Notes */}
                                            {((item.addons && item.addons.length > 0) || item.notes) && (
                                                <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                    {item.addons?.map((a, i) => <span key={i} className="block">• {typeof a.name === 'object' ? a.name.en : a.name} (+${a.price})</span>)}
                                                    {item.notes && <span className="block text-brand-600 italic">"{item.notes}"</span>}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-2 py-1 shadow-sm">
                                                    <button onClick={() => onUpdateQuantity(item.product?.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-brand-600">-</button>
                                                    <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => onUpdateQuantity(item.product?.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-brand-600">+</button>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => onRemoveItem(item.product?.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="p-6 border-t-2 border-black bg-[#FFFFF0]">
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-gray-600 font-medium"><span>Subtotal</span><span>{settings?.currency || '$'}{subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-gray-600 font-medium"><span>Tax ({settings?.taxRate || 10}%)</span><span>{settings?.currency || '$'}{tax.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-xl font-black text-black pt-3 border-t-2 border-black"><span>Total</span><span>{settings?.currency || '$'}{total.toFixed(2)}</span></div>
                                </div>
                                <button onClick={() => setStep('checkout')} className="w-full bg-black hover:bg-[#DC143C] text-white py-4 rounded-xl font-black text-lg uppercase tracking-wide shadow-[4px_4px_0px_0px_#DC143C] hover:shadow-[4px_4px_0px_0px_black] border-2 border-black flex items-center justify-center gap-2 transition-all">
                                    Proceed to Checkout <ArrowRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right overflow-y-auto">
                        <div className="flex-1 space-y-5">
                            <div className="bg-[#DC143C]/10 p-4 rounded-xl text-[#DC143C] text-sm flex items-center gap-3 border-2 border-[#DC143C]">
                                <Wallet size={20} />
                                <div>
                                    <p className="font-black">Total to Pay: {settings?.currency || '$'}{total.toFixed(2)}</p>
                                    <p className="text-xs opacity-75">Secure transaction</p>
                                </div>
                            </div>

                            {/* Order Type Selector */}
                            <div>
                                <label className="block text-sm font-black uppercase tracking-wide text-black mb-3">How would you like to order?</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => onOrderModeChange?.('dine_in')}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${orderMode === 'dine_in' ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black bg-white'}`}
                                    >
                                        <UtensilsCrossed size={20} />
                                        <span className="font-bold text-xs">Dine In</span>
                                    </button>
                                    <button
                                        onClick={() => onOrderModeChange?.('takeout')}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${orderMode === 'takeout' ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black bg-white'}`}
                                    >
                                        <ShoppingBag size={20} />
                                        <span className="font-bold text-xs">Takeout</span>
                                    </button>
                                    <button
                                        onClick={() => onOrderModeChange?.('delivery')}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${orderMode === 'delivery' ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black bg-white'}`}
                                    >
                                        <Truck size={20} />
                                        <span className="font-bold text-xs">Delivery</span>
                                    </button>
                                </div>
                            </div>

                            {/* Dine-in: Table Number */}
                            {orderMode === 'dine_in' && (
                                <div>
                                    <label className="block text-sm font-black uppercase tracking-wide text-black mb-2">Table Number</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 border-2 border-black rounded-xl focus:shadow-[4px_4px_0px_0px_black] outline-none font-bold text-center text-xl placeholder:text-gray-400"
                                        placeholder="Enter your table #"
                                        value={localTableNumber || ''}
                                        onChange={(e) => {
                                            const num = parseInt(e.target.value) || null;
                                            setLocalTableNumber(num);
                                            onTableNumberChange?.(num);
                                        }}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Find this on your table or ask staff</p>
                                </div>
                            )}

                            {/* Delivery: Address */}
                            {orderMode === 'delivery' && (
                                <div>
                                    <label className="block text-sm font-black uppercase tracking-wide text-black mb-2">Delivery Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full p-4 pl-12 border-2 border-black rounded-xl focus:shadow-[4px_4px_0px_0px_black] outline-none font-medium placeholder:text-gray-400"
                                            placeholder="123 Main St, City, State"
                                            value={deliveryAddress}
                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-black uppercase tracking-wide text-black mb-2">Receipt Email</label>
                                <input
                                    type="email"
                                    className="w-full p-4 border-2 border-black rounded-xl focus:shadow-[4px_4px_0px_0px_black] outline-none font-medium placeholder:text-gray-400"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black uppercase tracking-wide text-black mb-3">Payment Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('Card')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Card' ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_#DC143C]' : 'border-gray-200 hover:border-black bg-white'}`}
                                    >
                                        <CreditCard size={24} />
                                        <span className="font-bold text-sm">Card</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('Cash')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Cash' ? 'bg-green-600 text-white border-green-600 shadow-[2px_2px_0px_0px_black]' : 'border-gray-200 hover:border-black bg-white'}`}
                                    >
                                        <DollarSign size={24} />
                                        <span className="font-bold text-sm">Cash</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('Apple Pay')}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Apple Pay' ? 'bg-black text-white border-black' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <Wallet size={24} />
                                        <span className="font-bold text-sm">Apple Pay</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('Google Pay')}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Google Pay' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <Smartphone size={24} />
                                        <span className="font-bold text-sm">Google Pay</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('PayPal')}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'PayPal' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <Wallet size={24} />
                                        <span className="font-bold text-sm">PayPal</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('Venmo')}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Venmo' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <Smartphone size={24} />
                                        <span className="font-bold text-sm">Venmo</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('Zelle')}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Zelle' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <Smartphone size={24} />
                                        <span className="font-bold text-sm">Zelle</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 space-y-3">
                            <button
                                onClick={handleCheckout}
                                disabled={!email}
                                className="w-full bg-[#DC143C] hover:bg-black text-white py-4 rounded-xl font-black text-lg uppercase tracking-wide shadow-[4px_4px_0px_0px_black] border-2 border-black disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all"
                            >
                                Pay & Place Order
                            </button>
                            <button onClick={() => setStep('cart')} className="w-full py-3 text-black font-bold hover:underline">← Back to Cart</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
