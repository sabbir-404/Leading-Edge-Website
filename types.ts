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

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'moderator' | 'customer';
  joinDate: string;
}

export interface Order {
  id: string;
  userId?: string; // Link to User
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Unpaid';
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

export interface PageSection {
  id: string;
  type: 'text' | 'image-text' | 'columns';
  content: string; // For text
  image?: string;
  title?: string;
  columns?: string[]; // Array of strings for column content
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string; // url friendly
  hasHero: boolean;
  heroImage?: string;
  sections: PageSection[];
  placement: 'navbar' | 'footer' | 'both' | 'none';
  isSystem?: boolean; // If true, prevents deletion (e.g. About Us)
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
  isGlobal: boolean; 
  specificProductIds?: string[];
}

export interface SiteConfig {
  heroSlides: HeroSlide[];
  homeSections: HomeSection[];
  catalogues: Catalogue[];
  // Legacy about/shipping/returns removed in favor of CustomPage
}
