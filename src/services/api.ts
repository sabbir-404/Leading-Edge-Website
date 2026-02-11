
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const headers = {
  'Content-Type': 'application/json',
};

// Helper to handle responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || response.statusText);
  }
  return response.json();
};

export const api = {
  // Products
  getProducts: () => fetch(`${API_URL}/products`, { headers }).then(handleResponse),
  getProduct: (id: string) => fetch(`${API_URL}/products/${id}`, { headers }).then(handleResponse),
  
  // Categories
  getCategories: () => fetch(`${API_URL}/categories`, { headers }).then(handleResponse),
  
  // Orders
  createOrder: (orderData: any) => fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData)
  }).then(handleResponse),

  // Auth (Simplified for demo)
  login: (email: string, password?: string) => fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password })
  }).then(handleResponse),
};
