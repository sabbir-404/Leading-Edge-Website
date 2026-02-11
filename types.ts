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

export interface SpecificShippingCharge {
  areaId: string;
  charge: number;
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
  weight?: number; // in kg or lbs
  specificShippingCharges?: SpecificShippingCharge[];
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

export interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  alignment: 'center' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  buttonText?: string;
  buttonLink?: string;
}

export interface HomeSection {
  id: string;
  title: string;
  type: 'category' | 'ids';
  value: string | string[]; // Category Name or Array of Product IDs
  isVisible: boolean;
}

export interface ShippingArea {
  id: string;
  name: string;
}

export interface ShippingRate {
  minWeight: number;
  maxWeight: number;
  cost: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  areaIds: string[];
  type: 'flat' | 'weight';
  flatRate?: number;
  weightRates?: ShippingRate[];
  isGlobal: boolean; // If true, applies to all unless specific products excluded?
  specificProductIds?: string[]; // Only applies to these products if not global
  specificCategoryIds?: string[];
}

export interface SiteConfig {
  heroSlides: HeroSlide[];
  homeSections: HomeSection[];
  catalogues: Catalogue[];
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