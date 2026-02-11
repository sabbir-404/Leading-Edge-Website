
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
  createProduct: (product: any) => fetch(`${API_URL}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(product)
  }).then(handleResponse),
  updateProduct: (product: any) => fetch(`${API_URL}/products/${product.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(product)
  }).then(handleResponse),
  deleteProduct: (id: string) => fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers
  }).then(handleResponse),
  
  // Categories
  getCategories: () => fetch(`${API_URL}/categories`, { headers }).then(handleResponse),
  createCategory: (category: any) => fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify(category)
  }).then(handleResponse),
  updateCategory: (category: any) => fetch(`${API_URL}/categories/${category.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(category)
  }).then(handleResponse),
  deleteCategory: (id: string) => fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers
  }).then(handleResponse),
  
  // Users
  getUsers: () => fetch(`${API_URL}/users`, { headers }).then(handleResponse),
  createUser: (user: any) => fetch(`${API_URL}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(user)
  }).then(handleResponse),
  updateUser: (user: any) => fetch(`${API_URL}/users/${user.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(user)
  }).then(handleResponse),

  // Orders
  createOrder: (orderData: any) => fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData)
  }).then(handleResponse),

  // Auth
  login: (email: string, password?: string) => fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password })
  }).then(handleResponse),
};
