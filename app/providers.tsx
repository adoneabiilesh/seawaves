'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, CartItem, Order, OrderStatus, User, Language, RestaurantSettings } from '../types';

interface AppContextType {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Products state
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;

  // Cart state
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: Product, quantity: number, modifiers: string[], specialRequest: string) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Orders state
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Settings state
  language: Language;
  setLanguage: (lang: Language) => void;
  settings: RestaurantSettings;
  setSettings: React.Dispatch<React.SetStateAction<RestaurantSettings>>;

  // Tables state
  tables: number[];
  setTables: React.Dispatch<React.SetStateAction<number[]>>;
  addTable: (n: number) => void;
  removeTable: (n: number) => void;

  // Review state
  showReviewModal: boolean;
  setShowReviewModal: (show: boolean) => void;
  lastOrderId: string | null;
  setLastOrderId: (id: string | null) => void;
  restaurantId: string;
  
  // Checkout
  handleCheckout: (details: {paymentMethod: string, email: string}) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: { en: 'Truffle Wagyu Burger', it: 'Burger di Wagyu al Tartufo', fr: 'Burger Wagyu Truffe', de: 'Trüffel Wagyu Burger' },
    description: { 
        en: 'Premium Wagyu beef patty, truffle aioli, aged cheddar, brioche bun.',
        it: 'Hamburger di manzo Wagyu pregiato, aioli al tartufo, cheddar stagionato, pan brioche.',
        fr: 'Galette de bœuf Wagyu de première qualité, aïoli à la truffe, cheddar vieilli, pain brioché.',
        de: 'Premium Wagyu-Rindfleischpastete, Trüffel-Aioli, gereifter Cheddar, Brioche-Brötchen.'
    },
    recipe: {
        en: '1. Grill Wagyu patty for 3 mins per side. 2. Toast bun with butter. 3. Melt cheese on patty. 4. Spread aioli on bun. 5. Assemble.',
        it: '1. Grigliare la polpetta di Wagyu per 3 minuti per lato. 2. Tostare il pane con burro. 3. Sciogliere il formaggio. 4. Spalmare aioli. 5. Assemblare.',
        fr: '1. Griller la galette Wagyu 3 min par côté. 2. Griller le pain. 3. Fondre le fromage. 4. Étaler aïoli. 5. Assembler.',
        de: '1. Wagyu-Patty 3 Min pro Seite grillen. 2. Brötchen toasten. 3. Käse schmelzen. 4. Aioli verteilen. 5. Zusammenbauen.'
    },
    price: 24.50,
    category: 'Main Course' as any,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    nutrition: { calories: 850, protein: 45, carbs: 32, fat: 55 },
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    stock: 15,
    isAiGenerated: false,
    available: true
  },
  {
    id: '2',
    name: { en: 'Zen Garden Salad', it: 'Insalata Zen', fr: 'Salade Jardin Zen', de: 'Zen Gartensalat' },
    description: {
        en: 'Fresh mixed greens, edamame, avocado, ginger sesame dressing.',
        it: 'Verdure miste fresche, edamame, avocado, condimento allo zenzero e sesamo.',
        fr: 'Légumes verts mélangés frais, edamame, avocado, vinaigrette gingembre sésame.',
        de: 'Frisches gemischtes Grün, Edamame, Avocado, Ingwer-Sesam-Dressing.'
    },
    recipe: {
        en: '1. Toss greens. 2. Slice avocado. 3. Whisk ginger, sesame oil, soy sauce. 4. Drizzle dressing.',
        it: '1. Mescolare le verdure. 2. Affettare avocado. 3. Sbattere zenzero e olio. 4. Condire.',
        fr: '1. Mélanger salade. 2. Couper avocat. 3. Fouetter gingembre et huile. 4. Assaisonner.',
        de: '1. Grün mischen. 2. Avocado schneiden. 3. Ingwer und Öl verquirlen. 4. Würzen.'
    },
    price: 14.00,
    category: 'Appetizer' as any,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    nutrition: { calories: 320, protein: 12, carbs: 24, fat: 18 },
    allergens: ['Soy', 'Sesame', 'Vegan'],
    stock: 50,
    isAiGenerated: false,
    available: true
  },
  {
    id: '3',
    name: { en: 'Molten Lava Cake', it: 'Tortino al Cioccolato', fr: 'Moelleux au Chocolat', de: 'Schokoladen-Lava-Kuchen' },
    description: {
        en: 'Rich dark chocolate cake with a molten center, served with vanilla bean ice cream.',
        it: 'Ricca torta al cioccolato fondente con cuore fuso, servita con gelato alla vaniglia.',
        fr: 'Gâteau riche au chocolat noir avec un centre fondant, servi avec de la glace à la vanille.',
        de: 'Reichhaltiger dunkler Schokoladenkuchen mit flüssigem Kern, serviert mit Vanilleeis.'
    },
    recipe: {
        en: '1. Melt chocolate & butter. 2. Whisk eggs & sugar. 3. Fold in flour. 4. Bake at 400F for 12 mins. 5. Serve hot.',
        it: '1. Sciogliere cioccolato. 2. Sbattere uova. 3. Unire farina. 4. Infornare 12 min. 5. Servire caldo.',
        fr: '1. Fondre chocolat. 2. Battre oeufs. 3. Ajouter farine. 4. Cuire 12 min. 5. Servir chaud.',
        de: '1. Schokolade schmelzen. 2. Eier schlagen. 3. Mehl unterheben. 4. 12 Min backen. 5. Heiß servieren.'
    },
    price: 12.00,
    category: 'Dessert' as any,
    imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80',
    nutrition: { calories: 550, protein: 8, carbs: 65, fat: 28 },
    allergens: ['Dairy', 'Eggs', 'Gluten'],
    stock: 8,
    isAiGenerated: false,
    available: true
  }
];

const INITIAL_SETTINGS: RestaurantSettings = {
    name: 'CulinaryAI Bistro',
    currency: '$',
    taxRate: 8.5,
    primaryColor: '#f97316',
    openingHours: 'Mon-Sun: 11am - 10pm',
    address: '123 Innovation Blvd, Tech City'
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [tables, setTables] = useState<number[]>([1, 2, 3, 4, 5]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [settings, setSettings] = useState<RestaurantSettings>(INITIAL_SETTINGS);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const restaurantId = 'default-restaurant-id';

  const logout = () => {
    setUser(null);
    setCart([]);
  };

  const addToCart = (product: Product, quantity: number, modifiers: string[], specialRequest: string) => {
    setCart(prev => {
      const existing = prev.find(item => 
          item.id === product.id && 
          JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
      );
      if (existing) {
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity, modifiers, specialRequest }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    }));
  };

  const handleCheckout = (details: {paymentMethod: string, email: string}) => {
    if (cart.length === 0 || !user) return;
    
    let inventoryError = false;
    const updatedProducts = [...products];

    for (const item of cart) {
        const productIndex = updatedProducts.findIndex(p => p.id === item.id);
        if (productIndex !== -1) {
            if (updatedProducts[productIndex].stock < item.quantity) {
                alert(`Sorry, ${item.name.en} is out of stock!`);
                inventoryError = true;
                break;
            }
            updatedProducts[productIndex].stock -= item.quantity;
        }
    }

    if (inventoryError) return;

    setProducts(updatedProducts);

    const newOrder: Order = {
        id: Date.now().toString(),
        items: [...cart],
        total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) * (1 + settings.taxRate/100),
        status: OrderStatus.PENDING,
        timestamp: Date.now(),
        tableNumber: user.tableNumber,
        customerName: user.name,
        customerEmail: details.email,
        paymentMethod: details.paymentMethod as any
    };

    setOrders(prev => [...prev, newOrder]);
    setLastOrderId(newOrder.id);
    setCart([]);
    setIsCartOpen(false);
    
    // Show review modal after successful payment
    setTimeout(() => {
      setShowReviewModal(true);
    }, 500);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status } : order));
  };

  const addProduct = (product: Product) => setProducts(prev => [product, ...prev]);
  const updateProduct = (product: Product) => setProducts(prev => prev.map(p => p.id === product.id ? product : p));

  const addTable = (n: number) => !tables.includes(n) && setTables(prev => [...prev, n].sort((a,b)=>a-b));
  const removeTable = (n: number) => setTables(prev => prev.filter(t => t !== n));

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        logout,
        products,
        setProducts,
        addProduct,
        updateProduct,
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        isCartOpen,
        setIsCartOpen,
        orders,
        setOrders,
        updateOrderStatus,
        language,
        setLanguage,
        settings,
        setSettings,
        tables,
        setTables,
        addTable,
        removeTable,
        showReviewModal,
        setShowReviewModal,
        lastOrderId,
        setLastOrderId,
        restaurantId,
        handleCheckout,
      } as any}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

