export interface ProductVariation {
  id: string;
  type: string; // e.g., 'Color', 'Size'
  value: string; // e.g., 'Red', 'XL'
  price?: number;
  salePrice?: number;
  image?: string;
  modelNumber?: string;
  description?: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface ProductTab {
  id: string;
  title: string;
  content: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  onSale?: boolean;
  shortDescription: string;
  description: string; // Long description
  modelNumber: string;
  image: string; // Thumbnail
  images: string[]; // Gallery
  rating: number;
  features: string[];
  isVisible: boolean;
  variations: ProductVariation[];
  specifications: ProductSpecification[];
  customTabs: ProductTab[];
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
  pdfUrl: string;
  description: string;
  season: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariation?: ProductVariation;
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

export interface SiteConfig {
  heroSlides: {
    id: number;
    image: string;
    title: string;
    subtitle: string;
  }[];
  about: {
    title: string;
    content: string;
    image: string;
  };
  shipping: {
    content: string;
  };
  returns: {
    content: string;
  };
}