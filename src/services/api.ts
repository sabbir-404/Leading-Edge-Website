
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const headers = {
  'Content-Type': 'application/json',
};

const getHeaders = () => {
    const userStr = localStorage.getItem('furniture_user');
    const h = { ...headers };
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.role === 'admin') {
                // @ts-ignore
                h['x-admin-email'] = user.email;
            }
        } catch(e){}
    }
    return h;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || response.statusText);
  }
  return response.json();
};

export const api = {
  // Stats
  getStats: () => fetch(`${API_URL}/stats`, { headers: getHeaders() }).then(handleResponse),

  // File Upload
  uploadImage: async (file: File, context: 'product' | 'project', name: string) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('context', context);
      formData.append('name', name);
      
      const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          // Do NOT set Content-Type header manually for FormData, browser does it
          body: formData
      });
      return handleResponse(response);
  },

  // Products
  getProducts: () => fetch(`${API_URL}/products`, { headers }).then(handleResponse),
  getProduct: (id: string) => fetch(`${API_URL}/products/${id}`, { headers }).then(handleResponse),
  createProduct: (product: any) => fetch(`${API_URL}/products`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(product) }).then(handleResponse),
  updateProduct: (product: any) => fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(product) }).then(handleResponse),
  deleteProduct: (id: string) => fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  
  // Categories
  getCategories: () => fetch(`${API_URL}/categories`, { headers }).then(handleResponse),
  createCategory: (category: any) => fetch(`${API_URL}/categories`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(category) }).then(handleResponse),
  updateCategory: (category: any) => fetch(`${API_URL}/categories/${category.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(category) }).then(handleResponse),
  deleteCategory: (id: string) => fetch(`${API_URL}/categories/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  
  // Users
  getUsers: () => fetch(`${API_URL}/users`, { headers: getHeaders() }).then(handleResponse),
  createUser: (user: any) => fetch(`${API_URL}/users`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(user) }).then(handleResponse),
  updateUser: (user: any) => fetch(`${API_URL}/users/${user.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(user) }).then(handleResponse),

  // Projects
  getProjects: () => fetch(`${API_URL}/projects`, { headers }).then(handleResponse),
  createProject: (project: any) => fetch(`${API_URL}/projects`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(project) }).then(handleResponse),
  updateProject: (project: any) => fetch(`${API_URL}/projects/${project.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(project) }).then(handleResponse),
  deleteProject: (id: string) => fetch(`${API_URL}/projects/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Config
  getConfig: () => fetch(`${API_URL}/config`, { headers }).then(handleResponse),
  updateConfig: (config: any) => fetch(`${API_URL}/config`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(config) }).then(handleResponse),

  // Pages
  getPages: () => fetch(`${API_URL}/pages`, { headers }).then(handleResponse),
  createPage: (page: any) => fetch(`${API_URL}/pages`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(page) }).then(handleResponse),
  updatePage: (page: any) => fetch(`${API_URL}/pages/${page.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(page) }).then(handleResponse),
  deletePage: (id: string) => fetch(`${API_URL}/pages/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Orders
  getOrders: () => fetch(`${API_URL}/orders`, { headers: getHeaders() }).then(handleResponse),
  createOrder: (orderData: any) => fetch(`${API_URL}/orders`, { method: 'POST', headers, body: JSON.stringify(orderData) }).then(handleResponse),
  updateOrder: (order: any) => fetch(`${API_URL}/orders/${order.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(order) }).then(handleResponse),

  // Shipping
  getShippingAreas: () => fetch(`${API_URL}/shipping/areas`, { headers: getHeaders() }).then(handleResponse),
  updateShippingAreas: (areas: any[]) => fetch(`${API_URL}/shipping/areas`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(areas) }).then(handleResponse),
  getShippingMethods: () => fetch(`${API_URL}/shipping/methods`, { headers: getHeaders() }).then(handleResponse),
  updateShippingMethods: (methods: any[]) => fetch(`${API_URL}/shipping/methods`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(methods) }).then(handleResponse),

  // Newsletters
  getNewsletters: () => fetch(`${API_URL}/newsletters`, { headers: getHeaders() }).then(handleResponse),
  sendNewsletter: (data: any) => fetch(`${API_URL}/newsletters`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

  // Auth
  login: (email: string, password?: string) => fetch(`${API_URL}/auth/login`, { method: 'POST', headers, body: JSON.stringify({ email, password }) }).then(handleResponse),
};
