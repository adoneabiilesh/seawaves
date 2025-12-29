'use client';

import { Product } from '@/types';

const DEMO_PRODUCTS_KEY = 'culinaryai_demo_products';
const DEMO_RESTAURANT_KEY = 'culinaryai_demo_restaurant';

export interface DemoRestaurantInfo {
    name: string;
    currency: string;
}

// Products
export const saveDemoProducts = (products: Product[]): void => {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(products));
    }
};

export const getDemoProducts = (): Product[] => {
    if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(DEMO_PRODUCTS_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    return [];
};

export const addDemoProduct = (product: Product): void => {
    const products = getDemoProducts();
    products.push(product);
    saveDemoProducts(products);
};

export const updateDemoProduct = (product: Product): void => {
    const products = getDemoProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
        products[index] = product;
        saveDemoProducts(products);
    }
};

export const removeDemoProduct = (productId: string): void => {
    const products = getDemoProducts().filter(p => p.id !== productId);
    saveDemoProducts(products);
};

export const clearDemoProducts = (): void => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(DEMO_PRODUCTS_KEY);
    }
};

export const hasDemoProducts = (): boolean => {
    return getDemoProducts().length > 0;
};

// Restaurant Info
export const saveDemoRestaurantInfo = (info: DemoRestaurantInfo): void => {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(DEMO_RESTAURANT_KEY, JSON.stringify(info));
    }
};

export const getDemoRestaurantInfo = (): DemoRestaurantInfo | null => {
    if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(DEMO_RESTAURANT_KEY);
        return stored ? JSON.parse(stored) : null;
    }
    return null;
};

export const clearAllDemoData = (): void => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(DEMO_PRODUCTS_KEY);
        sessionStorage.removeItem(DEMO_RESTAURANT_KEY);
    }
};
