'use client';

import React, { useState, useRef } from 'react';
import { Product, ProductCategoryEnum } from '@/types';
import { parseMenuWithGroq, generateMenuItemWithGroq, getPlaceholderImage } from '@/services/groqService';
import { parseMenuFromImage, generateProductMetadata } from '@/services/geminiService';
import { Sparkles, Loader2, Camera, Check, ArrowRight, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface DemoMenuScannerProps {
    onProductsGenerated: (products: Product[]) => void;
    existingProducts?: Product[];
}

export const DemoMenuScanner: React.FC<DemoMenuScannerProps> = ({
    onProductsGenerated,
    existingProducts = []
}) => {
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedDrafts, setGeneratedDrafts] = useState<Product[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTextGenerate = async () => {
        if (!inputText.trim()) return;
        setIsGenerating(true);
        setStatusMessage('⚡ Generating menu items at lightning speed...');

        const items = inputText.split(/[,\n]+/).map(s => s.trim()).filter(s => s.length > 0);

        // Process all items in parallel for speed
        const promises = items.map(async (itemName) => {
            try {
                let metadata;
                try {
                    // Try Groq first (faster)
                    metadata = await generateMenuItemWithGroq(itemName);
                } catch (e) {
                    // Fallback to Gemini
                    metadata = await generateProductMetadata(itemName);
                }

                const newProduct: Product = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: metadata.name,
                    description: metadata.description,
                    recipe: metadata.recipe || { en: '' },
                    price: metadata.price,
                    category: metadata.category,
                    imageUrl: getPlaceholderImage(metadata.category), // Use placeholder - instant!
                    nutrition: metadata.nutrition,
                    allergens: metadata.allergens || [],
                    ingredients: metadata.ingredients || [],
                    pairings: metadata.pairings || { drinks: [], foods: [] },
                    stock: 20,
                    isAiGenerated: true,
                    available: true
                };

                return newProduct;
            } catch (error) {
                console.error(`Error generating ${itemName}:`, error);
                return null;
            }
        });

        const results = await Promise.all(promises);
        const validResults = results.filter((r): r is Product => r !== null);

        setGeneratedDrafts(prev => [...prev, ...validResults]);
        setIsGenerating(false);
        setInputText('');
        setStatusMessage('');
    };

    const handleImageUpload = async (file: File) => {
        setIsGenerating(true);
        setStatusMessage('⚡ Scanning your menu with Groq AI...');

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Image = reader.result as string;

                try {
                    let parsedItems;
                    try {
                        // Try Groq first (faster)
                        setStatusMessage('⚡ Ultra-fast AI reading your menu...');
                        parsedItems = await parseMenuWithGroq(base64Image);
                    } catch (e) {
                        // Fallback to Gemini
                        setStatusMessage('🔍 AI is reading your menu...');
                        parsedItems = await parseMenuFromImage(base64Image);
                    }

                    setStatusMessage(`✨ Found ${parsedItems.length} items!`);

                    const drafts: Product[] = parsedItems.map(item => ({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: item.name,
                        description: item.description,
                        recipe: item.recipe || { en: '' },
                        price: item.price,
                        category: item.category,
                        imageUrl: getPlaceholderImage(item.category), // Use placeholder - instant!
                        nutrition: item.nutrition,
                        allergens: item.allergens || [],
                        ingredients: item.ingredients || [],
                        pairings: item.pairings || { drinks: [], foods: [] },
                        stock: 20,
                        isAiGenerated: true,
                        available: true
                    }));

                    setGeneratedDrafts(prev => [...prev, ...drafts]);
                } catch (error) {
                    console.error("Error parsing menu:", error);
                    setStatusMessage('❌ Failed to read menu. Please try a clearer photo.');
                } finally {
                    setIsGenerating(false);
                    setStatusMessage('');
                }
            };
        } catch (error) {
            console.error("File reading error", error);
            setIsGenerating(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    };

    const handleApproveProduct = (product: Product) => {
        setGeneratedDrafts(prev => prev.filter(p => p.id !== product.id));
        onProductsGenerated([...existingProducts, product]);
    };

    const handleApproveAll = () => {
        onProductsGenerated([...existingProducts, ...generatedDrafts]);
        setGeneratedDrafts([]);
    };

    const handleDiscardProduct = (productId: string) => {
        setGeneratedDrafts(prev => prev.filter(p => p.id !== productId));
    };

    return (
        <div className="space-y-8">
            {/* Input Section */}
            <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Zap className="h-6 w-6 text-[#DC143C]" />
                        Ultra-Fast AI Menu Scanner
                    </CardTitle>
                    <CardDescription className="text-base">
                        Powered by Groq - scan your menu in seconds, not minutes
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    {/* Text Input */}
                    <div className="space-y-4">
                        <label className="font-bold text-sm">Type Dish Names</label>
                        <Textarea
                            placeholder="Enter dish names separated by commas or new lines, e.g.:
Margherita Pizza
Spaghetti Carbonara
Tiramisu"
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            rows={5}
                            className="border-2 border-black"
                        />
                        <Button
                            className="w-full bg-black text-white hover:bg-gray-800 font-bold"
                            onClick={handleTextGenerate}
                            disabled={isGenerating || !inputText.trim()}
                        >
                            {isGenerating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                            Generate Instantly
                        </Button>
                    </div>

                    {/* Image Upload */}
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all min-h-[200px]",
                            dragActive ? "border-[#DC143C] bg-[#DC143C]/5" : "border-black/30 hover:border-black hover:bg-black/5"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                        />
                        <Camera className="h-12 w-12 mb-4 text-[#DC143C]" />
                        <span className="font-bold text-lg">Scan Menu Photo</span>
                        <span className="text-sm text-gray-500 text-center mt-2">
                            Drag & drop or click to upload<br />
                            JPG, PNG up to 10MB
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Status Message */}
            {statusMessage && (
                <div className="p-4 bg-gradient-to-r from-black to-gray-800 text-white rounded-xl flex items-center gap-3 font-medium">
                    <Loader2 className="animate-spin h-5 w-5" />
                    {statusMessage}
                </div>
            )}

            {/* Generated Drafts */}
            {generatedDrafts.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">
                            Generated Products ({generatedDrafts.length})
                        </h3>
                        <Button
                            onClick={handleApproveAll}
                            className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-bold"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Approve All & Continue
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {generatedDrafts.map(draft => (
                            <Card key={draft.id} className="border-2 border-black overflow-hidden">
                                <div className="h-40 bg-gray-100 relative">
                                    <img src={draft.imageUrl} alt={draft.name.en} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => handleDiscardProduct(draft.id)}
                                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <CardContent className="p-4">
                                    <h4 className="font-bold text-lg">{draft.name.en}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{draft.description.en}</p>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xl font-bold text-[#DC143C]">${draft.price.toFixed(2)}</span>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproveProduct(draft)}
                                            className="bg-black text-white hover:bg-gray-800"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
