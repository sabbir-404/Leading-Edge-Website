import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, User, Order, SiteConfig, ShippingArea, ShippingMethod } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SITE_CONFIG, INITIAL_SHIPPING_AREAS, INITIAL_SHIPPING_METHODS } from '../constants';

interface ShopContextType {
  products: Product[];
  cart: CartItem[];
  user: User | null;
  orders: Order[];
  siteConfig: SiteConfig;
  shippingAreas: ShippingArea[];
  shippingMethods: ShippingMethod[];
  addToCart: (product: Product, variation?: any) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  login: (email: string) => void;
  logout: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  deleteProductsBulk: (productIds: string[]) => void;
  updateProductsStatusBulk: (productIds: string[], isVisible: boolean) => void;
  updateSiteConfig: (config: SiteConfig) => void;
  updateShippingAreas: (areas: ShippingArea[]) => void;
  updateShippingMethods: (methods: ShippingMethod[]) => void;
  cartTotal: number;
  itemCount: number;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [shippingAreas, setShippingAreas] = useState<ShippingArea[]>(INITIAL_SHIPPING_AREAS);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(INITIAL_SHIPPING_METHODS);

  // Cart Logic
  const addToCart = (product: Product, variation?: any) => {
    setCart((prev) => {
      // Find item with same ID AND same variation
      const existing = prev.find((item) => {
        const sameId = item.id === product.id;
        const sameVariation = variation 
          ? item.selectedVariation?.id === variation.id 
          : !item.selectedVariation;
        return sameId && sameVariation;
      });

      if (existing) {
        return prev.map((item) => {
          const sameId = item.id === product.id;
          const sameVariation = variation 
            ? item.selectedVariation?.id === variation.id 
            : !item.selectedVariation;
            
          return (sameId && sameVariation)
            ? { ...item, quantity: item.quantity + 1 } 
            : item;
        });
      }
      return [...prev, { ...product, quantity: 1, selectedVariation: variation }];
    });
  };

  const updateQuantity = (productId: string, quantity: number, variationId?: string) => {
    if (quantity < 1) {
      removeFromCart(productId, variationId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        const sameId = item.id === productId;
        const sameVariation = variationId 
          ? item.selectedVariation?.id === variationId 
          : !item.selectedVariation;

        return (sameId && sameVariation) ? { ...item, quantity: quantity } : item;
      })
    );
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart((prev) => prev.filter((item) => {
      const sameId = item.id === productId;
      const sameVariation = variationId 
        ? item.selectedVariation?.id === variationId 
        : !item.selectedVariation;
      return !(sameId && sameVariation);
    }));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => {
    // Use variation price if available
    let price = item.price;
    if (item.selectedVariation) {
      if (item.onSale && item.selectedVariation.salePrice) price = item.selectedVariation.salePrice;
      else if (item.selectedVariation.price) price = item.selectedVariation.price;
      else if (item.onSale && item.salePrice) price = item.salePrice;
    } else {
       if (item.onSale && item.salePrice) price = item.salePrice;
    }
    return sum + price * item.quantity;
  }, 0);
  
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Auth Logic
  const login = (email: string) => {
    const isAdmin = email.includes('admin');
    setUser({
      id: 'u1',
      name: email.split('@')[0],
      email,
      isAdmin,
    });
    // Mock loading orders for user
    if (!isAdmin) {
      setOrders([
        {
          id: 'ORD-2023-001',
          date: '2023-10-15',
          status: 'Delivered',
          total: 450.00,
          items: products.slice(0, 2).map(p => ({...p, quantity: 1}))
        }
      ]);
    }
  };

  const logout = () => {
    setUser(null);
    setOrders([]);
  };

  // Admin Logic
  const addProduct = (product: Product) => {
    const newProduct = { ...product, id: product.id || `PROD-${Date.now()}` };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const deleteProductsBulk = (productIds: string[]) => {
    setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
  };

  const updateProductsStatusBulk = (productIds: string[], isVisible: boolean) => {
    setProducts(prev => prev.map(p => productIds.includes(p.id) ? { ...p, isVisible } : p));
  };

  const updateSiteConfig = (config: SiteConfig) => {
    setSiteConfig(config);
  };

  const updateShippingAreas = (areas: ShippingArea[]) => {
    setShippingAreas(areas);
  };

  const updateShippingMethods = (methods: ShippingMethod[]) => {
    setShippingMethods(methods);
  };

  return (
    <ShopContext.Provider value={{ 
      products, cart, user, orders, siteConfig, shippingAreas, shippingMethods,
      addToCart, removeFromCart, updateQuantity, clearCart, 
      login, logout, 
      addProduct, updateProduct, deleteProduct, deleteProductsBulk, updateProductsStatusBulk,
      updateSiteConfig, updateShippingAreas, updateShippingMethods,
      cartTotal, itemCount 
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};