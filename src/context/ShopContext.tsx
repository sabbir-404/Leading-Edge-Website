
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, User, Order, SiteConfig, ShippingArea, ShippingMethod, CustomPage, DashboardStats, NewsletterCampaign, Catalogue, ToastMessage, Category, Project } from '../types';
import { INITIAL_SITE_CONFIG, INITIAL_SHIPPING_AREAS, INITIAL_SHIPPING_METHODS, INITIAL_PAGES, MOCK_STATS, INITIAL_PROJECTS } from '../constants';
import { api } from '../services/api';

interface ShopContextType {
  products: Product[];
  categories: Category[];
  projects: Project[];
  cart: CartItem[];
  user: User | null;
  users: User[]; 
  orders: Order[]; 
  siteConfig: SiteConfig;
  customPages: CustomPage[];
  shippingAreas: ShippingArea[];
  shippingMethods: ShippingMethod[];
  dashboardStats: DashboardStats;
  newsletters: NewsletterCampaign[];
  toasts: ToastMessage[];
  addToCart: (product: Product, variation?: any) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  login: (email: string) => void;
  logout: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  deleteProductsBulk: (productIds: string[]) => void;
  updateProductsStatusBulk: (productIds: string[], isVisible: boolean) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  reorderCategories: (orderedIds: string[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  updateSiteConfig: (config: SiteConfig) => void;
  addCatalogue: (catalogue: Catalogue) => void;
  updateCatalogue: (catalogue: Catalogue) => void;
  deleteCatalogue: (catalogueId: string) => void;
  addPage: (page: CustomPage) => void;
  updatePage: (page: CustomPage) => void;
  deletePage: (pageId: string) => void;
  updateShippingAreas: (areas: ShippingArea[]) => void;
  updateShippingMethods: (methods: ShippingMethod[]) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  updateOrder: (order: Order) => void;
  createOrder: (order: Order) => void;
  sendNewsletter: (campaign: NewsletterCampaign) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  isLoading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [isLoading, setIsLoading] = useState(true);

  // Shopping State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  // Admin Data States
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [customPages, setCustomPages] = useState<CustomPage[]>(INITIAL_PAGES);
  const [shippingAreas, setShippingAreas] = useState<ShippingArea[]>(INITIAL_SHIPPING_AREAS);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(INITIAL_SHIPPING_METHODS);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(MOCK_STATS);
  const [newsletters, setNewsletters] = useState<NewsletterCampaign[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [prodData, catData] = await Promise.all([
          api.getProducts().catch(err => { console.error(err); return []; }), 
          api.getCategories().catch(err => { console.error(err); return []; })
        ]);

        if (prodData.length > 0) setProducts(prodData);
        if (catData.length > 0) setCategories(catData);
        
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        showToast("Backend connection failed.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toast Logic
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), 3000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
  const login = async (email: string) => {
    try {
      const userData = await api.login(email);
      setUser(userData);
      showToast('Logged in successfully', 'success');
    } catch (e) {
      const newUser: User = { 
        id: `u-${Date.now()}`, 
        name: email.split('@')[0], 
        email, 
        role: email.includes('admin') ? 'admin' : 'customer',
        joinDate: new Date().toISOString().split('T')[0]
      };
      setUser(newUser);
      showToast('Logged in (Local)', 'info');
    }
  };

  const logout = () => {
    setUser(null);
    showToast('Logged out', 'info');
  };

  // --- CRUD Operations ---

  const addProduct = async (product: Product) => {
    try {
        // Ensure ID
        const newProduct = { ...product, id: product.id || `PROD-${Date.now()}` };
        // Optimistic Update
        setProducts(prev => [...prev, newProduct]);
        
        await api.createProduct(newProduct);
        showToast('Product added successfully', 'success');
    } catch (e) {
        showToast('Failed to save product', 'error');
        console.error(e);
        // Revert optimistic update? For simplicity, we keep it but warn user.
    }
  };
  
  const updateProduct = async (product: Product) => {
    try {
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        await api.updateProduct(product);
        showToast('Product updated', 'success');
    } catch (e) {
        showToast('Failed to update product', 'error');
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
        setProducts(prev => prev.filter(p => p.id !== productId));
        await api.deleteProduct(productId);
        showToast('Product deleted', 'info');
    } catch (e) {
        showToast('Failed to delete product', 'error');
    }
  };

  const deleteProductsBulk = (productIds: string[]) => {
    // Bulk delete API not implemented in backend yet, doing one by one or just UI update
    setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
    // Ideally loop and call API
    productIds.forEach(id => api.deleteProduct(id).catch(console.error));
    showToast(`${productIds.length} products deleted`, 'info');
  };

  const updateProductsStatusBulk = (productIds: string[], isVisible: boolean) => {
    setProducts(prev => prev.map(p => {
        if (productIds.includes(p.id)) {
            const updated = { ...p, isVisible };
            api.updateProduct(updated).catch(console.error); // Update individually in background
            return updated;
        }
        return p;
    }));
    showToast('Statuses updated', 'success');
  };

  // Categories
  const addCategory = async (category: Category) => {
    try {
        setCategories(prev => [...prev, category]);
        await api.createCategory(category);
        showToast('Category added', 'success');
    } catch (e) {
        showToast('Failed to add category', 'error');
    }
  };

  const updateCategory = async (category: Category) => {
    try {
        setCategories(prev => prev.map(c => c.id === category.id ? category : c));
        await api.updateCategory(category);
        showToast('Category updated', 'success');
    } catch (e) {
        showToast('Failed to update category', 'error');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        await api.deleteCategory(categoryId);
        showToast('Category deleted', 'info');
    } catch (e) {
        showToast('Failed to delete category', 'error');
    }
  };

  const reorderCategories = (orderedIds: string[]) => {
    setCategories(prev => {
        const newCats = [...prev];
        orderedIds.forEach((id, index) => {
            const found = newCats.find(c => c.id === id);
            if (found) {
                found.order = index;
                api.updateCategory(found).catch(console.error); // Sync order to backend
            }
        });
        return newCats;
    });
  };

  // Projects (Local State Only for now, backend not implemented in schema yet for projects)
  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
    showToast('Project added (Local Only)', 'success');
  };

  const updateProject = (project: Project) => {
    setProjects(prev => prev.map(p => p.id === project.id ? project : p));
    showToast('Project updated (Local Only)', 'success');
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    showToast('Project deleted (Local Only)', 'info');
  };
  
  // Other Settings (Local Only for now)
  const updateSiteConfig = (config: SiteConfig) => {
    setSiteConfig(config);
    showToast('Configuration saved (Local Only)', 'success');
  };

  const addCatalogue = (catalogue: Catalogue) => {
    setSiteConfig(prev => ({ ...prev, catalogues: [...prev.catalogues, catalogue] }));
    showToast('Catalogue added', 'success');
  };
  const updateCatalogue = (catalogue: Catalogue) => {
    setSiteConfig(prev => ({ ...prev, catalogues: prev.catalogues.map(c => c.id === catalogue.id ? catalogue : c) }));
    showToast('Catalogue updated', 'success');
  };
  const deleteCatalogue = (catalogueId: string) => {
    setSiteConfig(prev => ({ ...prev, catalogues: prev.catalogues.filter(c => c.id !== catalogueId) }));
    showToast('Catalogue deleted', 'info');
  };
  
  const addPage = (page: CustomPage) => {
    setCustomPages(prev => [...prev, page]);
    showToast('Page created', 'success');
  };
  const updatePage = (page: CustomPage) => {
    setCustomPages(prev => prev.map(p => p.id === page.id ? page : p));
    showToast('Page updated', 'success');
  };
  const deletePage = (pageId: string) => {
    setCustomPages(prev => prev.filter(p => p.id !== pageId));
    showToast('Page deleted', 'info');
  };

  const updateShippingAreas = (areas: ShippingArea[]) => setShippingAreas(areas);
  const updateShippingMethods = (methods: ShippingMethod[]) => setShippingMethods(methods);

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
    showToast('User added', 'success');
  };
  const updateUser = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    showToast('User updated', 'success');
  };

  const updateOrder = (order: Order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    showToast('Order updated', 'success');
  };
  
  const createOrder = async (order: Order) => {
    try {
      await api.createOrder(order);
      setOrders(prev => [order, ...prev]);
      setDashboardStats(prev => ({
          ...prev,
          totalOrdersMonth: prev.totalOrdersMonth + 1,
          revenueMonth: prev.revenueMonth + order.total
      }));
      clearCart();
      showToast('Order created successfully', 'success');
    } catch (e) {
      showToast('Failed to create order on server', 'error');
    }
  };

  const sendNewsletter = (campaign: NewsletterCampaign) => {
    setNewsletters(prev => [campaign, ...prev]);
    showToast('Newsletter sent', 'success');
  };

  return (
    <ShopContext.Provider value={{ 
      products, categories, projects, cart, user, users, orders, siteConfig, customPages, shippingAreas, shippingMethods,
      dashboardStats, newsletters, toasts, isLoading,
      addToCart, removeFromCart, updateQuantity, clearCart, 
      login, logout, 
      addProduct, updateProduct, deleteProduct, deleteProductsBulk, updateProductsStatusBulk,
      addCategory, updateCategory, deleteCategory, reorderCategories,
      addProject, updateProject, deleteProject,
      updateSiteConfig,
      addCatalogue, updateCatalogue, deleteCatalogue,
      addPage, updatePage, deletePage,
      updateShippingAreas, updateShippingMethods,
      addUser, updateUser,
      updateOrder, createOrder,
      sendNewsletter,
      showToast, dismissToast,
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
