import React from 'react';
import Navbar from '../components/Navbar';
import HeroSlider from '../components/HeroSlider';
import CategoryGrid from '../components/CategoryGrid';
import ProductSlider from '../components/ProductSlider';
import CatalogueSlider from '../components/CatalogueSlider';
import Footer from '../components/Footer';
import { useShop } from '../context/ShopContext';
import { FEATURED_SECTIONS_TITLES } from '../constants';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const { products } = useShop();

  // Filter Sales
  const saleProducts = products.filter(p => p.onSale);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        <section>
          <HeroSlider />
        </section>

        {/* Sale Section */}
        {saleProducts.length > 0 && (
          <div className="bg-red-50 mt-8 relative">
             <div className="absolute top-12 left-4 md:left-auto md:right-12 max-w-7xl mx-auto w-full z-10 pointer-events-none">
                 <div className="flex justify-end pointer-events-auto px-8">
                     <Link to="/gallery/sale" className="text-red-600 font-bold text-sm flex items-center hover:underline">
                         View All Sale <ArrowRight size={14} className="ml-1" />
                     </Link>
                 </div>
             </div>
            <ProductSlider title="Flash Sale" products={saleProducts} />
          </div>
        )}

        <CategoryGrid />

        <div className="space-y-8 mb-20">
          {FEATURED_SECTIONS_TITLES.map((title) => {
             const categoryProducts = products.filter(p => p.category === title);
             if (categoryProducts.length === 0) return null;
             return (
              <div key={title} className="relative">
                  {/* "See all products" button positioned on the left side of the header area, effectively next to title in visual flow, or below it depending on implementation. 
                      Since ProductSlider has the title built-in, we need to hack it slightly or overlay the link. 
                      A cleaner way is to render the link inside the slider component, but here I'll overlay it or modify the slider logic. 
                      Actually, let's just place a container around the ProductSlider. */}
                  
                  <div className="max-w-7xl mx-auto px-4 relative top-16 z-10 flex justify-end pointer-events-none">
                       {/* This is positioned absolute relative to the flow. 
                           Actually, modifying ProductSlider to accept a 'seeAllLink' prop is cleaner, but to stick to the requested file changes structure, I will use this overlay method. */}
                       <div className="pointer-events-auto">
                           <Link to={`/gallery/${title}`} className="flex items-center text-sm font-bold text-accent hover:text-primary transition-colors">
                               See All {title} <ArrowRight size={14} className="ml-1" />
                           </Link>
                       </div>
                  </div>
                  
                  <ProductSlider 
                    title={title} 
                    products={categoryProducts} 
                  />
              </div>
            );
          })}
        </div>

        {/* Catalogue Slider */}
        <CatalogueSlider />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
