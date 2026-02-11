import { Product, Category, Catalogue, SiteConfig, ShippingArea, ShippingMethod } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Furniture', image: 'https://picsum.photos/seed/furn/400/400' },
  { id: '2', name: 'Light', image: 'https://picsum.photos/seed/light/400/400' },
  { id: '3', name: 'Kitchenware', image: 'https://picsum.photos/seed/kitchen/400/400' },
  { id: '4', name: 'Hardware', image: 'https://picsum.photos/seed/hard/400/400' },
  { id: '5', name: 'Decor', image: 'https://picsum.photos/seed/decor/400/400' },
  { id: '6', name: 'Outdoor', image: 'https://picsum.photos/seed/out/400/400' },
  { id: '7', name: 'Rugs', image: 'https://picsum.photos/seed/rugs/400/400' },
  { id: '8', name: 'Bath', image: 'https://picsum.photos/seed/bath/400/400' },
];

export const MAIN_MENU_CATEGORIES = ['Furniture', 'Light', 'Kitchenware', 'Hardware', 'Sale'];

export const INITIAL_CATALOGUES: Catalogue[] = [
  {
    id: 'cat-2024-spring',
    title: 'Spring Collection 2024',
    coverImage: 'https://picsum.photos/seed/cat1/500/700',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'Explore our latest arrivals for the blooming season. Fresh colors, sustainable materials, and outdoor living essentials.',
    season: 'Spring 2024'
  },
  {
    id: 'cat-2023-winter',
    title: 'Winter Warmth',
    coverImage: 'https://picsum.photos/seed/cat2/500/700',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'Cozy up your home with our premium leather selection, warm lighting solutions, and heavy textiles.',
    season: 'Winter 2023'
  },
  {
    id: 'cat-lighting-edit',
    title: 'The Lighting Edit',
    coverImage: 'https://picsum.photos/seed/cat3/500/700',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'A curated look at our most architectural lighting fixtures. From chandeliers to minimalism desk lamps.',
    season: 'Annual 2024'
  }
];

// For backward compatibility if imported elsewhere, though we now use siteConfig.catalogues
export const CATALOGUES = INITIAL_CATALOGUES; 

export const HERO_SLIDES = [
  {
    id: 1,
    image: 'https://picsum.photos/seed/hero1/1920/1080',
    title: 'Modern Comfort',
    subtitle: 'Redefining the living room experience.',
    alignment: 'left-bottom' as const,
    buttonText: 'Shop Now',
    buttonLink: '/gallery/Furniture'
  },
  {
    id: 2,
    image: 'https://picsum.photos/seed/hero2/1920/1080',
    title: 'Artistic Spaces',
    subtitle: 'Curated for the visionary home.',
    alignment: 'center' as const,
    buttonText: 'View Collection',
    buttonLink: '/gallery/Decor'
  },
  {
    id: 3,
    image: 'https://picsum.photos/seed/hero3/1920/1080',
    title: 'Sustainable Luxury',
    subtitle: 'Eco-friendly materials, premium feel.',
    alignment: 'right-bottom' as const
  },
];

const generateProducts = (category: string, count: number, startId: number): Product[] => {
  return Array.from({ length: count }).map((_, i) => {
    const price = Math.floor(Math.random() * 500) + 100;
    const onSale = Math.random() > 0.8;
    return {
      id: `${category}-${startId + i}`,
      name: `${category} Model ${i + 1}`,
      category: category,
      price: price,
      salePrice: onSale ? Math.floor(price * 0.8) : undefined,
      onSale: onSale,
      shortDescription: `Elegant ${category.toLowerCase()} piece.`,
      description: `A stunning piece of ${category.toLowerCase()} that blends modern aesthetics with timeless utility. Crafted with precision and care, this item is designed to elevate your living space.`,
      modelNumber: `LE-${category.substring(0, 3).toUpperCase()}-${startId + i}`,
      image: `https://picsum.photos/seed/${category}${i}/600/600`, 
      images: [
        `https://picsum.photos/seed/${category}${i}/600/600`,
        `https://picsum.photos/seed/${category}${i}a/600/600`,
        `https://picsum.photos/seed/${category}${i}b/600/600`,
      ],
      rating: 4 + Math.random(),
      features: ['Premium Materials', 'Handcrafted', '5-Year Warranty', 'Eco-Friendly'],
      isVisible: true,
      variations: [],
      specifications: [
        { key: 'Material', value: 'Premium Composite' },
        { key: 'Dimensions', value: 'Standard' }
      ],
      customTabs: [],
      weight: 10,
      specificShippingCharges: []
    };
  });
};

export const INITIAL_PRODUCTS = [
  ...generateProducts('Furniture', 12, 100),
  ...generateProducts('Light', 12, 200),
  ...generateProducts('Kitchenware', 12, 300),
  ...generateProducts('Hardware', 12, 400),
];

export const INITIAL_SITE_CONFIG: SiteConfig = {
  heroSlides: HERO_SLIDES,
  homeSections: [
    { id: 'sec-1', title: 'Furniture', type: 'category', value: 'Furniture', isVisible: true },
    { id: 'sec-2', title: 'Light', type: 'category', value: 'Light', isVisible: true },
    { id: 'sec-3', title: 'Kitchenware', type: 'category', value: 'Kitchenware', isVisible: true },
    { id: 'sec-4', title: 'Hardware', type: 'category', value: 'Hardware', isVisible: true },
  ],
  catalogues: INITIAL_CATALOGUES,
  about: {
    title: "Crafting the Future of Living",
    content: "Founded in 2024, Leading Edge was born from a desire to bridge the gap between high-concept art and functional living. We believe that furniture shouldn't just fill a space; it should define it. Our curators travel the globe to find pieces that speak to the modern soul—minimalist yet bold, sustainable yet luxurious.",
    image: "https://picsum.photos/seed/showroom/1920/1080"
  },
  shipping: {
    content: "Leading Edge offers shipping to all 50 states. Orders are typically processed within 1-2 business days. Standard shipping takes 5-7 business days to arrive. For large furniture items (sofas, beds, dining tables), we utilize a White Glove Delivery service."
  },
  returns: {
    content: "We want you to be completely satisfied with your purchase. If you are not happy with your item, you may return it within 30 days of receiving your order for a full refund or exchange. Items must be unused, unwashed, and in their original condition."
  }
};

export const INITIAL_SHIPPING_AREAS: ShippingArea[] = [
  { id: 'area-us', name: 'United States' },
  { id: 'area-can', name: 'Canada' },
  { id: 'area-eu', name: 'Europe' },
];

export const INITIAL_SHIPPING_METHODS: ShippingMethod[] = [
  { 
    id: 'method-std', 
    name: 'Standard Shipping', 
    areaIds: ['area-us'], 
    type: 'flat', 
    flatRate: 29.99, 
    isGlobal: true 
  },
  { 
    id: 'method-exp', 
    name: 'Express Shipping', 
    areaIds: ['area-us'], 
    type: 'weight', 
    weightRates: [
       { minWeight: 0, maxWeight: 5, cost: 15 },
       { minWeight: 5, maxWeight: 20, cost: 35 },
       { minWeight: 20, maxWeight: 100, cost: 80 }
    ], 
    isGlobal: true 
  }
];

export const FEATURED_SECTIONS_TITLES = ['Furniture', 'Light', 'Kitchenware', 'Hardware']; // Deprecated reference, kept for safety