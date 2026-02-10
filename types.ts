export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  onSale?: boolean;
  description: string;
  modelNumber: string;
  image: string;
  images?: string[]; // For gallery
  rating: number;
  features: string[];
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface Catalogue {
  id: string;
  title: string;
  coverImage: string;
  pdfUrl: string; // In a real app this is a path to a PDF
  description: string;
  season: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered';
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}
