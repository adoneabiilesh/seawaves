// User and Restaurant Types
export interface User {
  id: string;
  name: string;
  email?: string;
  role: 'customer' | 'admin' | 'owner' | 'manager' | 'waiter' | 'kitchen';
  tableNumber?: number;
  restaurantId?: string;
}

export interface Product {
  id: string;
  restaurantId?: string;
  categoryId?: string; // Foreign Key
  name: { en: string; ar?: string } | any;
  description: { en: string; ar?: string } | any;
  recipe?: { en: string; ar?: string } | any;
  price: number;
  category: string; // Legacy string for UI grouping if needed, or derived from categoryId
  imageUrl?: string;
  imageId?: string; // Reference to image_metadata table
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  allergens?: string[];
  ingredients?: string[];
  pairings?: {
    drinks: string[];
    foods: string[];
  };
  stock: number;
  available?: boolean;
  isAiGenerated?: boolean;
  weight?: string;
  // Product variants (e.g., sizes, options)
  variants?: ProductVariant[];
}

// Product variant for size options (e.g., Small/Medium/Large, 33ml/66ml)
export interface ProductVariant {
  id: string;
  name: string;           // "33ml", "66ml", "Small", "Large"
  priceModifier: number;  // Price adjustment (+0, +2.50, etc.) - can be absolute price or delta
  isDefault?: boolean;    // Default selected option
  available?: boolean;
}

export interface CartItem {
  id?: string; // Optional for cart items not yet saved
  product: Product; // Changed from just properties to full product reference
  quantity: number;
  notes?: string;
  addons?: Addon[];
  selectedVariant?: ProductVariant; // Selected size/option
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface Order {
  id: string;
  items: any[]; // Simplified for now to avoid circular deps or complex mapping
  total: number;
  status: OrderStatus;
  tableNumber?: number;
  tableSessionId?: string; // Reference to active table session
  customerName?: string;
  paymentMode?: 'online' | 'counter' | 'pay_later';
  specialRequests?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TableSessionStatus = 'active' | 'closed' | 'expired';

export interface TableSession {
  id: string;
  restaurantId: string;
  tableNumber: number;
  sessionToken: string;
  status: TableSessionStatus;
  startedAt: string;
  closedAt?: string;
  totalAmount: number;
  paidAmount: number;
  guestCount: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // Virtual fields from joins
  orders?: Order[];
}

export interface RestaurantSettings {
  name: string;
  currency: string;
  taxRate: number;
  primaryColor: string;
  openingHours: string;
  address: string;
  logoUrl?: string;
}

// Legacy enums for compatibility (with different names to avoid conflicts)
export enum ProductCategoryEnum {
  APPETIZER = 'Appetizer',
  MAIN = 'Main Course',
  DESSERT = 'Dessert',
  DRINK = 'Drink',
  UNKNOWN = 'Special'
}

// Export as ProductCategory for backward compatibility
export const ProductCategory = ProductCategoryEnum;


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

export type View = 'MENU' | 'ADMIN' | 'KITCHEN';

export interface Addon {
  id: string;
  name: { en: string; ar?: string } | any;
  price: number;
  category?: string;
  available: boolean;
}

export interface Category {
  id: string;
  name: { en: string; ar?: string } | any;
  description?: { en: string; ar?: string } | any;
  displayOrder: number;
  available?: boolean; // Schema doesn't have it but useful
}
