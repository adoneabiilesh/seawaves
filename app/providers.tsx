'use client';

import { SessionProvider } from 'next-auth/react';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, RestaurantSettings, Product, Order, CartItem, Category, Addon } from '../types';
import { supabase } from '@/lib/db';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  settings: RestaurantSettings;
  setSettings: (settings: RestaurantSettings) => void;
  updateSettings: (settings: RestaurantSettings) => Promise<void>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addons: Addon[];
  setAddons: React.Dispatch<React.SetStateAction<Addon[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  handleCheckout: (details: { paymentMethod: string; email: string }) => Promise<void>;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  tables: number[];
  tenant: { id: string; name: string; subdomain: string } | null;
  restaurantId: string | null;
  addTable: (tableNumber: number) => void;
  removeTable: (tableNumber: number) => void;
  showReviewModal: boolean;
  setShowReviewModal: (show: boolean) => void;
  lastOrderId: string | null;
  logout: () => void;
  orderMode: 'dine_in' | 'delivery' | 'takeout' | null;
  setOrderMode: (mode: 'dine_in' | 'delivery' | 'takeout' | null) => void;
  tableNumber: number | null;
  setTableNumber: (table: number | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: 'My Restaurant',
    currency: '$',
    taxRate: 10,
    primaryColor: '#f97316',
    openingHours: '09:00 - 22:00',
    address: '123 Main St',
    logoUrl: ''
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tables, setTables] = useState<number[]>([1, 2, 3, 4]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [orderMode, setOrderMode] = useState<'dine_in' | 'delivery' | 'takeout' | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  const [tenant, setTenant] = useState<{ id: string; name: string; subdomain: string } | null>(null);
  const [fallbackRestaurantId, setFallbackRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (typeof window === 'undefined') return;
      const host = window.location.host;
      const parts = host.split('.');

      let subdomain = parts[0];
      if (host.includes('localhost')) {
        if (parts.length > 1 && parts[parts.length - 2] === 'localhost') {
          subdomain = parts[0];
        } else {
          subdomain = 'localhost';
        }
      }

      const mainDomains = ['www', 'localhost', 'yourplatform'];
      if (mainDomains.includes(subdomain)) {
        // On main domain - fetch first restaurant as fallback for development
        const { data: firstRestaurant } = await supabase
          .from('Restaurant')
          .select('*')
          .limit(1)
          .single();

        if (firstRestaurant) {
          setFallbackRestaurantId(firstRestaurant.id);
          setSettings(prev => ({ ...prev, name: firstRestaurant.name, logoUrl: firstRestaurant.logoUrl || '' }));
        }
        return;
      }

      const { data } = await supabase.from('Restaurant').select('*').eq('subdomain', subdomain).maybeSingle();
      if (data) {
        setTenant(data);
        setSettings(prev => ({ ...prev, name: data.name, logoUrl: data.logoUrl || '' }));
      }
    };

    fetchTenant();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Filter by tenant if available
      const query = supabase.from('Product').select('*').eq('available', true);
      if (tenant) query.eq('restaurantId', tenant.id);

      const { data: productData } = await query;
      if (productData) setProducts(productData);

      // Categories
      const catQuery = supabase.from('Category').select('*').order('displayOrder');
      if (tenant) catQuery.eq('restaurantId', tenant.id);
      const { data: categoryData } = await catQuery;
      if (categoryData) setCategories(categoryData);

      // Addons
      const addonQuery = supabase.from('Addon').select('*').eq('available', true);
      if (tenant) addonQuery.eq('restaurantId', tenant.id);
      const { data: addonData } = await addonQuery;
      if (addonData) setAddons(addonData);

      // Tables
      const tableQuery = supabase.from('Table').select('tableNumber');
      if (tenant) tableQuery.eq('restaurantId', tenant.id);
      const { data: tableData } = await tableQuery;
      if (tableData) setTables(tableData.map((t: { tableNumber: number }) => t.tableNumber));
    };

    fetchData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Order' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant]);

  // Use restaurant ID if available from user or hardcoded for now
  // For this demo, we assume single tenant or handled by RLS via Supabase if setup. 
  // But we need a restaurantId for inserts.
  // We'll fetch the first restaurantId for operations if not in user context.
  const getRestaurantId = async () => {
    // Simplified: return user.restaurantId or fetch first
    if (user?.restaurantId) return user.restaurantId;
    const { data } = await supabase.from('Restaurant').select('id').limit(1).single();
    return data?.id;
  };

  const addProduct = async (product: Product) => {
    const restaurantId = await getRestaurantId();
    if (!restaurantId) return;

    const { id, ...dataToInsert } = product;
    // If ID is temp (numeric string), drop it. 
    // Types define id as string. 
    // Supabase will generate UUID.

    const { data, error } = await supabase.from('Product').insert({
      ...dataToInsert,
      restaurantId,
      // Ensure name/desc are objects not string
      name: typeof product.name === 'string' ? { en: product.name } : product.name,
      description: typeof product.description === 'string' ? { en: product.description } : product.description,
    }).select().single();

    if (data) {
      setProducts([...products, data]);
    } else if (error) {
      console.error("Error adding product", error);
    }
  };

  const updateProduct = async (product: Product) => {
    const { data, error } = await supabase.from('Product').update(product).eq('id', product.id).select().single();
    if (data) {
      setProducts(products.map(p => p.id === product.id ? data : p));
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('Product').delete().eq('id', id);
    if (!error) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const addCategory = async (category: Category) => {
    const restaurantId = await getRestaurantId();
    if (!restaurantId) {
      console.error("No restaurantId available for adding category");
      return;
    }

    const { id, ...dataToInsert } = category;

    // Ensure name is in JSONB format
    const nameValue = typeof category.name === 'string'
      ? { en: category.name }
      : category.name;

    const descValue = category.description
      ? (typeof category.description === 'string' ? { en: category.description } : category.description)
      : null;

    const { data, error } = await supabase.from('Category').insert({
      restaurantId,
      name: nameValue,
      description: descValue,
      displayOrder: category.displayOrder || 0,
    }).select().single();

    if (error) {
      console.error("Error adding category:", error);
    } else if (data) {
      setCategories([...categories, data]);
    }
  };

  const updateCategory = async (category: Category) => {
    const { data, error } = await supabase.from('Category').update(category).eq('id', category.id).select().single();
    if (data) setCategories(categories.map(c => c.id === category.id ? data : c));
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('Category').delete().eq('id', id);
    if (!error) setCategories(categories.filter(c => c.id !== id));
  };

  const addTable = (tableNumber: number) => {
    // Implement real table add later
    if (!tables.includes(tableNumber)) {
      setTables([...tables, tableNumber]);
    }
  };

  const removeTable = (tableNumber: number) => {
    // Implement real table remove later
    setTables(tables.filter(t => t !== tableNumber));
  };

  const updateSettings = async (newSettings: RestaurantSettings) => {
    // Update local state immediately
    setSettings(newSettings);

    // Persist to database if we have a tenant
    if (tenant?.id) {
      const { error } = await supabase
        .from('Restaurant')
        .update({
          name: newSettings.name,
          currency: newSettings.currency,
          taxRate: newSettings.taxRate,
          primaryColor: newSettings.primaryColor,
          openingHours: newSettings.openingHours,
          address: newSettings.address,
          logoUrl: newSettings.logoUrl,
        })
        .eq('id', tenant.id);

      if (error) {
        console.error('Error saving settings:', error);
      }
    }
  };

  // Cart functions
  const addToCart = (item: CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.product.id === item.product.id);
      if (existingItem) {
        return prevCart.map(i =>
          i.product.id === item.product.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prevCart, item];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleCheckout = async (details: { paymentMethod: string; email: string }) => {
    if (cart.length === 0) return;

    const restaurantId = tenant?.id || fallbackRestaurantId || (await getRestaurantId());
    if (!restaurantId) {
      console.error('No restaurant ID available for checkout');
      return;
    }

    const subtotal = cart.reduce((sum, item) => {
      const itemTotal = item.product.price * item.quantity;
      const addonsTotal = item.addons?.reduce((a, addon) => a + addon.price, 0) || 0;
      return sum + itemTotal + addonsTotal;
    }, 0);

    const taxRate = settings.taxRate || 10;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const orderData = {
      restaurantId,
      subtotal,
      tax,
      total,
      status: 'pending',
      paymentMode: details.paymentMethod,
      tableNumber: tableNumber || user?.tableNumber || null,
      customerName: user?.name || details.email,
      specialRequests: cart.map(item => item.notes).filter(Boolean).join('; ') || null,
      // Note: orderType column would need to be added to database via migration
      // orderType: orderMode || 'dine_in',
    };

    const { data, error } = await supabase
      .from('Order')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      alert('Failed to place order. Please try again.');
      return;
    }

    if (data) {
      // Insert order items
      const orderItems = cart.map(item => ({
        orderId: data.id,
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        customizations: item.addons ? { addons: item.addons.map(a => ({ id: a.id, name: typeof a.name === 'object' ? a.name.en : a.name, price: a.price })) } : null
      }));

      const { error: itemsError } = await supabase
        .from('OrderItem')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
      }

      console.log('Order placed successfully:', data.id);
      alert(`Order placed successfully! Order #${data.id.slice(-6).toUpperCase()}`);

      setOrders(prev => [...prev, data]);
      setLastOrderId(data.id);
      setCart([]);
      setIsCartOpen(false);
      setShowReviewModal(true);
    }
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    window.location.href = '/login';
  };

  return (
    <SessionProvider>
      <AppContext.Provider value={{
        user,
        setUser,
        settings,
        setSettings,
        updateSettings,
        products,
        setProducts,
        categories,
        setCategories,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addons,
        setAddons,
        orders,
        setOrders,
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        handleCheckout,
        isCartOpen,
        setIsCartOpen,
        tables,
        tenant,
        restaurantId: tenant?.id || fallbackRestaurantId,
        addTable,
        removeTable,
        showReviewModal,
        setShowReviewModal,
        lastOrderId,
        logout,
        orderMode,
        setOrderMode,
        tableNumber,
        setTableNumber
      }}>
        {children}
      </AppContext.Provider>
    </SessionProvider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
