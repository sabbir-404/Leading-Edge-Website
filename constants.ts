import { Product, Category, Catalogue } from './types';

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

export const CATALOGUES: Catalogue[] = [
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

export const HERO_SLIDES = [
  {
    id: 1,
    image: 'https://picsum.photos/seed/hero1/1920/1080',
    title: 'Modern Comfort',
    subtitle: 'Redefining the living room experience.',
  },
  {
    id: 2,
    image: 'https://picsum.photos/seed/hero2/1920/1080',
    title: 'Artistic Spaces',
    subtitle: 'Curated for the visionary home.',
  },
  {
    id: 3,
    image: 'https://picsum.photos/seed/hero3/1920/1080',
    title: 'Sustainable Luxury',
    subtitle: 'Eco-friendly materials, premium feel.',
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
      description: `A stunning piece of ${category.toLowerCase()} that blends modern aesthetics with timeless utility.`,
      modelNumber: `LE-${category.substring(0, 3).toUpperCase()}-${startId + i}`,
      image: `https://picsum.photos/seed/${category}${i}/600/600`, // 1:1 Ratio
      images: [
        `https://picsum.photos/seed/${category}${i}/600/600`,
        `https://picsum.photos/seed/${category}${i}a/600/600`,
        `https://picsum.photos/seed/${category}${i}b/600/600`,
      ],
      rating: 4 + Math.random(),
      features: ['Premium Materials', 'Handcrafted', '5-Year Warranty', 'Eco-Friendly'],
    };
  });
};

// Initial Data Loading
export const INITIAL_PRODUCTS = [
  ...generateProducts('Furniture', 12, 100),
  ...generateProducts('Light', 12, 200),
  ...generateProducts('Kitchenware', 12, 300),
  ...generateProducts('Hardware', 12, 400),
];

export const FEATURED_SECTIONS_TITLES = ['Furniture', 'Light', 'Kitchenware', 'Hardware'];
