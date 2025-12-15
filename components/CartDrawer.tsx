
import React, { useState } from 'react';
import { CartItem, RestaurantSettings } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, CreditCard, Wallet, DollarSign, Smartphone } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onCheckout: (details: {paymentMethod: string, email: string}) => void;
  settings: RestaurantSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemoveItem, 
  onUpdateQuantity,
  onCheckout,
  settings
}) => {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash' | 'Apple Pay' | 'Google Pay' | 'PayPal' | 'Venmo' | 'Zelle'>('Card');

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * (settings.taxRate / 100);
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
                <div key={`${item.id}-${idx}`} className="flex gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 group relative">
                    <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-200" />
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h4 className="font-semibold text-gray-900 line-clamp-1">{item.name.en}</h4>
                            <p className="text-brand-600 font-medium text-sm">{settings.currency}{item.price.toFixed(2)}</p>
                        </div>
                        {/* Modifiers & Special Request */}
                        {(item.modifiers.length > 0 || item.specialRequest) && (
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                                {item.modifiers.map(m => <span key={m} className="block">• {m}</span>)}
                                {item.specialRequest && <span className="block text-brand-600 italic">"{item.specialRequest}"</span>}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-2 py-1 shadow-sm">
                            <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-brand-600">-</button>
                            <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-brand-600">+</button>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => onRemoveItem(item.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
                ))
            )}
            </div>
            
            {items.length > 0 && (
                 <div className="p-6 border-t border-gray-100 bg-white">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{settings.currency}{subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-gray-500"><span>Tax ({settings.taxRate}%)</span><span>{settings.currency}{tax.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-100"><span>Total</span><span>{settings.currency}{total.toFixed(2)}</span></div>
                    </div>
                    <button onClick={() => setStep('checkout')} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2">
                        Checkout <ArrowRight size={20} />
                    </button>
                </div>
            )}
            </>
        ) : (
            <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right">
                <div className="flex-1 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm flex items-center gap-3">
                         <Wallet size={20} />
                         <div>
                            <p className="font-bold">Total to Pay: {settings.currency}{total.toFixed(2)}</p>
                            <p className="text-xs opacity-75">Secure transaction powered by Stripe (Simulated)</p>
                         </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Email</label>
                        <input 
                            type="email" 
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" 
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setPaymentMethod('Card')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Card' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                <CreditCard size={24} />
                                <span className="font-bold text-sm">Card</span>
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('Cash')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Cash' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 hover:bg-gray-50'}`}
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

                <div className="mt-auto pt-6">
                    <button 
                        onClick={handleCheckout} 
                        disabled={!email}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Pay & Place Order
                    </button>
                    <button onClick={() => setStep('cart')} className="w-full mt-3 text-gray-500 font-medium hover:underline">Back to Cart</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
