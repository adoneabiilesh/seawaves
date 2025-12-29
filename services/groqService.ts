'use client';

import { ProductCategoryEnum, LocalizedText } from '@/types';

export interface ParsedMenuItem {
    name: LocalizedText;
    description: LocalizedText;
    recipe: LocalizedText;
    price: number;
    category: ProductCategoryEnum;
    nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    allergens: string[];
    ingredients: string[];
    pairings: {
        drinks: string[];
        foods: string[];
    };
}

// Placeholder images for different categories
const PLACEHOLDER_IMAGES: Record<string, string> = {
    'Appetizer': 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&h=300&fit=crop',
    'Main Course': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    'Dessert': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
    'Drink': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
    'Special': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    'default': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop'
};

export const getPlaceholderImage = (category: string): string => {
    return PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES['default'];
};

// NOTE: Groq vision models (llama-3.2-*b-vision-preview) have been decommissioned
// Image parsing now uses Gemini directly - see geminiService.ts
// This file only provides fast TEXT generation via Groq (still works great!)

// Placeholder function that always throws - forces fallback to Gemini
export async function parseMenuWithGroq(base64Image: string): Promise<ParsedMenuItem[]> {
    throw new Error('Groq vision models decommissioned - using Gemini instead');
}

// Groq-powered fast text-to-menu generation
export async function generateMenuItemWithGroq(dishName: string): Promise<ParsedMenuItem> {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'user',
                    content: `Create a restaurant menu item for "${dishName}". Return a JSON object with:
- name: { en: "English name", it: "Italian", fr: "French", de: "German" }
- description: { en: "Appetizing description", it: "", fr: "", de: "" }
- recipe: { en: "Preparation method", it: "", fr: "", de: "" }
- price: realistic price as number (USD)
- category: one of "Appetizer", "Main Course", "Dessert", "Drink", "Special"
- nutrition: { calories: number, protein: number, carbs: number, fat: number }
- allergens: ["Gluten", "Dairy", etc]
- ingredients: ["ingredient1", "ingredient2"]
- pairings: { drinks: ["drink1"], foods: ["side1"] }

Return ONLY valid JSON object, no other text.`
                }
            ],
            temperature: 0.5,
            max_tokens: 1024
        })
    });

    if (!response.ok) {
        throw new Error('Groq API request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    // Parse JSON from response
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

    return JSON.parse(jsonStr.trim());
}
