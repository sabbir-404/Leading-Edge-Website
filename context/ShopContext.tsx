import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, User, Order, SiteConfig, ShippingArea, ShippingMethod, CustomPage, DashboardStats, NewsletterCampaign, Catalogue } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SITE_CONFIG, INITIAL_SHIPPING_AREAS, INITIAL_SHIPPING_METHODS, INITIAL_PAGES, MOCK_USERS, MOCK_ORDERS, MOCK_STATS } from '../constants';

interface ShopContextType {
  products: Product[];
  cart: CartItem[];
  user: User | null;
  users: User[]; 
  orders: Order[]; 
  siteConfig: SiteConfig;
  customPages: CustomPage[];
  shippingAreas: ShippingArea[];
  shippingMethods: ShippingMethod[];
  
  // Dashboard & Misc
  dashboardStats: DashboardStats;
  newsletters: NewsletterCampaign[];
  
  // Cart Actions
  addToCart: (product: Product, variation?: any) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;

  // Auth
  login: (email: string) => void;
  logout: () => void;

  // Admin Actions
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  deleteProductsBulk: (productIds: string[]) => void;
  updateProductsStatusBulk: (productIds: string[], isVisible: boolean) => void;
  
  updateSiteConfig: (config: SiteConfig) => void;
  
  // Catalogue Actions
  addCatalogue: (catalogue: Catalogue) => void;
  updateCatalogue: (catalogue: Catalogue) => void;
  deleteCatalogue: (catalogueId: string) => void;

  // Page Actions
  addPage: (page: CustomPage) => void;
  updatePage: (page: CustomPage) => void;
  deletePage: (pageId: string) => void;

  // Shipping Actions
  updateShippingAreas: (areas: ShippingArea[]) => void;
  updateShippingMethods: (methods: ShippingMethod[]) => void;

  // User Actions
  addUser: (user: User) => void;
  updateUser: (user: User) => void;

  // Order Actions
  updateOrder: (order: Order) => void;
  createOrder: (order: Order) => void;

  // Newsletter Actions
  sendNewsletter: (campaign: NewsletterCampaign) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  // Admin Data States
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [customPages, setCustomPages] = useState<CustomPage[]>(INITIAL_PAGES);
  const [shippingAreas, setShippingAreas] = useState<ShippingArea[]>(INITIAL_SHIPPING_AREAS);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(INITIAL_SHIPPING_METHODS);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(MOCK_STATS);
  const [newsletters, setNewsletters] = useState<NewsletterCampaign[]>([]);

  // Cart Logic
  const addToCart = (product: Product, variation?: any) => {
    setCart((prev) => {
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
          return (sameId && sameVariation) ? { ...item, quantity: item.quantity + 1 } : item;
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
        const sameVariation = variationId ? item.selectedVariation?.id === variationId : !item.selectedVariation;
        return (sameId && sameVariation) ? { ...item, quantity: quantity } : item;
      })
    );
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart((prev) => prev.filter((item) => {
      const sameId = item.id === productId;
      const sameVariation = variationId ? item.selectedVariation?.id === variationId : !item.selectedVariation;
      return !(sameId && sameVariation);
    }));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => {
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
    // Find in mock users or create session
    const existing = users.find(u => u.email === email);
    if (existing) {
      setUser(existing);
    } else {
      // Mock login fallback
      const newUser: User = { 
        id: `u-${Date.now()}`, 
        name: email.split('@')[0], 
        email, 
        role: email.includes('admin') ? 'admin' : 'customer',
        joinDate: new Date().toISOString().split('T')[0]
      };
      setUser(newUser);
      if(!email.includes('admin')) setUsers(prev => [...prev, newUser]);
    }
  };

  const logout = () => {
    setUser(null);
  };

  // Admin Actions
  const addProduct = (product: Product) => setProducts(prev => [...prev, { ...product, id: product.id || `PROD-${Date.now()}` }]);
  const updateProduct = (product: Product) => setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  const deleteProduct = (productId: string) => setProducts(prev => prev.filter(p => p.id !== productId));
  const deleteProductsBulk = (productIds: string[]) => setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
  const updateProductsStatusBulk = (productIds: string[], isVisible: boolean) => setProducts(prev => prev.map(p => productIds.includes(p.id) ? { ...p, isVisible } : p));
  
  const updateSiteConfig = (config: SiteConfig) => setSiteConfig(config);

  // Catalogue Actions
  const addCatalogue = (catalogue: Catalogue) => {
    setSiteConfig(prev => ({ ...prev, catalogues: [...prev.catalogues, catalogue] }));
  };
  const updateCatalogue = (catalogue: Catalogue) => {
    setSiteConfig(prev => ({ ...prev, catalogues: prev.catalogues.map(c => c.id === catalogue.id ? catalogue : c) }));
  };
  const deleteCatalogue = (catalogueId: string) => {
    setSiteConfig(prev => ({ ...prev, catalogues: prev.catalogues.filter(c => c.id !== catalogueId) }));
  };
  
  // Page Actions
  const addPage = (page: CustomPage) => setCustomPages(prev => [...prev, page]);
  const updatePage = (page: CustomPage) => setCustomPages(prev => prev.map(p => p.id === page.id ? page : p));
  const deletePage = (pageId: string) => setCustomPages(prev => prev.filter(p => p.id !== pageId));

  // Shipping
  const updateShippingAreas = (areas: ShippingArea[]) => setShippingAreas(areas);
  const updateShippingMethods = (methods: ShippingMethod[]) => setShippingMethods(methods);

  // User Actions
  const addUser = (user: User) => setUsers(prev => [...prev, user]);
  const updateUser = (user: User) => setUsers(prev => prev.map(u => u.id === user.id ? user : u));

  // Order Actions
  const updateOrder = (order: Order) => setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  const createOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
    // Update Dashboard Stats (mock)
    setDashboardStats(prev => ({
        ...prev,
        totalOrdersMonth: prev.totalOrdersMonth + 1,
        revenueMonth: prev.revenueMonth + order.total
    }));
  };

  // Newsletter Actions
  const sendNewsletter = (campaign: NewsletterCampaign) => setNewsletters(prev => [campaign, ...prev]);

  return (
    <ShopContext.Provider value={{ 
      products, cart, user, users, orders, siteConfig, customPages, shippingAreas, shippingMethods,
      dashboardStats, newsletters,
      addToCart, removeFromCart, updateQuantity, clearCart, 
      login, logout, 
      addProduct, updateProduct, deleteProduct, deleteProductsBulk, updateProductsStatusBulk,
      updateSiteConfig,
      addCatalogue, updateCatalogue, deleteCatalogue,
      addPage, updatePage, deletePage,
      updateShippingAreas, updateShippingMethods,
      addUser, updateUser,
      updateOrder, createOrder,
      sendNewsletter,
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