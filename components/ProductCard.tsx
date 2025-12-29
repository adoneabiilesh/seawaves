
import React, { useState, useEffect } from 'react';
import { Product, Language, ProductVariant } from '../types';
import { Plus, Flame, Activity, X, Info, AlertTriangle, Check, BookOpen } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product, quantity: number, modifiers: string[], specialRequest: string, selectedVariant?: ProductVariant) => void;
    currentLang: Language;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, currentLang }) => {
    const [showModal, setShowModal] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [modifiers, setModifiers] = useState<string[]>([]);
    const [specialRequest, setSpecialRequest] = useState('');
    const [showRecipe, setShowRecipe] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);

    // Set default variant when modal opens
    useEffect(() => {
        if (showModal && product.variants && product.variants.length > 0) {
            const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
            setSelectedVariant(defaultVariant);
        }
    }, [showModal, product.variants]);

    const isOutOfStock = product.stock <= 0;
    const hasVariants = product.variants && product.variants.length > 0;

    // Calculate final price with variant modifier
    const getItemPrice = () => {
        const basePrice = product.price;
        const variantModifier = selectedVariant?.priceModifier || 0;
        return basePrice + variantModifier;
    };

    const handleAddToCart = () => {
        onAddToCart(product, quantity, modifiers, specialRequest, selectedVariant);
        setShowModal(false);
        setQuantity(1);
        setModifiers([]);
        setSpecialRequest('');
        setSelectedVariant(undefined);
    };

    const toggleModifier = (mod: string) => {
        setModifiers(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
    };

    const availableModifiers = ["Extra Sauce", "No Onions", "Gluten Free Bread", "Spicy"];

    return (
        <>
            <div className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group h-full ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                        src={product.imageUrl}
                        alt={product.name[currentLang]}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                        ${product.price.toFixed(2)}{hasVariants && '+'}
                    </div>

                    {product.isAiGenerated && (
                        <div className="absolute top-3 left-3 bg-indigo-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1">
                            AI Chef
                        </div>
                    )}

                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">SOLD OUT</span>
                        </div>
                    )}
                </div>

                <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{product.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{product.name[currentLang]}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description[currentLang]}</p>

                    {product.allergens && product.allergens.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {product.allergens.map(a => (
                                <span key={a} className="text-[9px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100">{a}</span>
                            ))}
                        </div>
                    )}

                    <div className="mt-auto">
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                            <div className="flex items-center gap-1 text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded-full whitespace-nowrap">
                                <Flame size={10} /> {product.nutrition?.calories || 0} kcal
                            </div>
                            <div className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                                <Activity size={10} /> P: {product.nutrition?.protein || 0}g
                            </div>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            disabled={isOutOfStock}
                            className={`w-full py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${isOutOfStock
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-900 hover:bg-brand-600 text-white'
                                }`}
                        >
                            <Plus size={16} />
                            {isOutOfStock ? 'Out of Stock' : 'Add to Order'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Customization Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-lg z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="relative h-48 flex-shrink-0">
                            <img src={product.imageUrl} alt={product.name[currentLang]} className="w-full h-full object-cover" loading="lazy" />
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                                <h2 className="text-2xl font-bold text-white">{product.name[currentLang]}</h2>
                                <p className="text-white/80 text-sm mt-1">${getItemPrice().toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Variant Selector (Size Options) */}
                            {hasVariants && (
                                <div className="mb-6">
                                    <h3 className="font-bold text-gray-900 mb-3">Select Size</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants!.map(variant => (
                                            <button
                                                key={variant.id}
                                                onClick={() => setSelectedVariant(variant)}
                                                disabled={variant.available === false}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedVariant?.id === variant.id
                                                        ? 'bg-[#DC143C] border-[#DC143C] text-white'
                                                        : variant.available === false
                                                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#DC143C]'
                                                    }`}
                                            >
                                                {variant.name}
                                                {variant.priceModifier > 0 && (
                                                    <span className="ml-1 text-xs opacity-75">+${variant.priceModifier.toFixed(2)}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex gap-4 mb-4 border-b border-gray-100">
                                <button
                                    onClick={() => setShowRecipe(false)}
                                    className={`pb-2 text-sm font-bold transition-colors ${!showRecipe ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}
                                >
                                    Details
                                </button>
                                {product.recipe?.[currentLang] && (
                                    <button
                                        onClick={() => setShowRecipe(true)}
                                        className={`pb-2 text-sm font-bold transition-colors flex items-center gap-1 ${showRecipe ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}
                                    >
                                        <BookOpen size={14} /> Recipe
                                    </button>
                                )}
                            </div>

                            {showRecipe ? (
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-gray-800 leading-relaxed">
                                    <h4 className="font-bold mb-2 text-orange-900">Preparation</h4>
                                    {product.recipe?.[currentLang]}
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-600 mb-6">{product.description[currentLang]}</p>

                                    {product.allergens && product.allergens.length > 0 && (
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                                            <div className="flex items-center gap-2 text-red-800 font-bold mb-2">
                                                <AlertTriangle size={18} /> Contains Allergens
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {product.allergens.map(a => (
                                                    <span key={a} className="px-2 py-1 bg-white rounded-md text-xs font-semibold text-red-600 border border-red-100 shadow-sm">{a}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h3 className="font-bold text-gray-900 mb-3">Customize</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {availableModifiers.map(mod => (
                                                <button
                                                    key={mod}
                                                    onClick={() => toggleModifier(mod)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${modifiers.includes(mod)
                                                            ? 'bg-brand-50 border-brand-500 text-brand-700'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {mod}
                                                    {modifiers.includes(mod) && <Check size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="mb-6 mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                    rows={2}
                                    placeholder="Allergy details, extra napkins, etc."
                                    value={specialRequest}
                                    onChange={(e) => setSpecialRequest(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center gap-4 mt-auto">
                            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-brand-600 font-bold text-lg">-</button>
                                <span className="font-bold text-gray-900 w-4 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-brand-600 font-bold text-lg">+</button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                            >
                                Add ${(getItemPrice() * quantity).toFixed(2)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
