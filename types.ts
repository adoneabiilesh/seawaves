
export enum ProductCategory {
  APPETIZER = 'Appetizer',
  MAIN = 'Main Course',
  DESSERT = 'Dessert',
  DRINK = 'Drink',
  UNKNOWN = 'Special'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED'
}

export type Language = 'en' | 'it' | 'fr' | 'de';

export interface LocalizedText {
  en: string;
  it: string;
  fr: string;
  de: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Product {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  recipe: LocalizedText; // Added Recipe
  price: number;
  category: ProductCategory;
  imageUrl: string;
  nutrition: Nutrition;
  allergens: string[];
  stock: number;
  isAiGenerated: boolean;
  available: boolean; // Publishing status
}

export interface CartItem extends Product {
  quantity: number;
  modifiers: string[];
  specialRequest?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: number;
  tableNumber?: string;
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: 'Card' | 'Cash' | 'Apple Pay' | 'Google Pay' | 'PayPal' | 'Venmo' | 'Zelle';
}

export type View = 'MENU' | 'ADMIN' | 'KITCHEN';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'customer';
  tableNumber?: string;
}

export interface RestaurantSettings {
  name: string;
  logoUrl?: string; // Brand customization
  currency: string;
  taxRate: number;
  primaryColor: string;
  openingHours: string; // "09:00 - 22:00"
  address: string;
}
