import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useShop } from '../context/ShopContext';
import { ArrowLeft, Star, CheckCircle2, ShoppingCart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, products } = useShop();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('desc');
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    const found = products.find(p => p.id === id);
    if (found) {
      setProduct(found);
      setMainImage(found.image);
      window.scrollTo(0, 0);
    }
  }, [id, products]);

  if (!product) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const tabs = [
    { id: 'desc', label: 'Description' },
    { id: 'specs', label: 'Specifications' },
    { id: 'reviews', label: 'Reviews (124)' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'returns', label: 'Returns & Exchange' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-20">
          
          {/* Left Column: Sticky Image & Gallery */}
          <div className="relative">
             <div className="sticky top-24">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={mainImage}
                  // Changed aspect-square to aspect-[4/3] on mobile to save vertical space
                  className="w-full bg-gray-100 aspect-[4/3] md:aspect-square rounded-lg overflow-hidden border border-gray-100 relative mb-4"
                >
                  <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                  {product.onSale && (
                     <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-4 py-2 uppercase tracking-wider">
                        On Sale
                     </div>
                  )}
                </motion.div>
                
                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-4">
                   <div 
                      className={`aspect-square rounded border cursor-pointer overflow-hidden ${mainImage === product.image ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setMainImage(product.image)}
                   >
                      <img src={product.image} className="w-full h-full object-cover" />
                   </div>
                   {product.images?.map((img, idx) => (
                      <div 
                        key={idx} 
                        className={`aspect-square rounded border cursor-pointer overflow-hidden ${mainImage === img ? 'border-primary' : 'border-transparent'}`}
                        onClick={() => setMainImage(img)}
                      >
                         <img src={img} className="w-full h-full object-cover" />
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col">
            <span className="text-gray-400 text-sm mb-2">{product.category}</span>
            <h1 className="text-2xl md:text-5xl font-serif font-bold text-primary mb-2 leading-tight">
              {product.name}
            </h1>
            <p className="text-sm text-gray-400 mb-6 font-mono">Model: {product.modelNumber}</p>
            
            <div className="flex items-end gap-4 mb-8 border-b border-gray-100 pb-8">
              {product.onSale ? (
                <div className="flex flex-col">
                   <span className="text-3xl font-bold text-red-600">${product.salePrice}</span>
                   <span className="text-lg text-gray-400 line-through">${product.price}</span>
                </div>
              ) : (
                <span className="text-3xl font-semibold text-primary">${product.price}</span>
              )}
              
              <div className="flex items-center text-accent mb-1 ml-auto">
                <Star fill="currentColor" size={18} />
                <span className="ml-2 text-gray-500 text-sm font-bold">4.8</span>
                <span className="text-gray-400 text-sm ml-1">(124 Reviews)</span>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-8 text-lg">
              {product.description}
            </p>

            <div className="space-y-4 mb-8">
               <button 
                  onClick={() => addToCart(product)}
                  className="w-full bg-primary text-white py-4 px-8 font-medium hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} /> Add to Cart
                </button>
                <button 
                  onClick={() => { addToCart(product); navigate('/checkout'); }}
                  className="w-full bg-accent text-white py-4 px-8 font-medium hover:bg-orange-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <Zap size={20} fill="currentColor" /> Buy Now
                </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-green-600 mb-12">
               <CheckCircle2 size={16} />
               <span>In Stock & Ready to Ship</span>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <div className="border-b border-gray-200 overflow-x-auto no-scrollbar">
                <div className="flex min-w-max">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id 
                          ? 'border-accent text-accent' 
                          : 'border-transparent text-gray-500 hover:text-primary'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-6 text-gray-600 leading-relaxed text-sm">
                {activeTab === 'desc' && (
                  <p>Experience the perfect blend of style and comfort with the {product.name}. Designed by award-winning furniture architects, this piece utilizes sustainable materials sourced from verified suppliers.</p>
                )}
                {activeTab === 'specs' && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Model: {product.modelNumber}</li>
                    <li>Dimensions: 32" H x 64" W x 36" D</li>
                    <li>Material: Solid Oak, Linen</li>
                  </ul>
                )}
                {activeTab === 'reviews' && <p>Customer reviews content...</p>}
                {activeTab === 'shipping' && <p>Standard shipping: 5-7 business days. White glove available.</p>}
                {activeTab === 'returns' && <p>30-Day Return Policy on original condition items.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* You Might Also Like */}
        <h2 className="text-2xl font-serif font-bold mb-8">Related Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4).map(p => (
             <div key={p.id} className="cursor-pointer group" onClick={() => navigate(`/product/${p.id}`)}>
               <div className="bg-gray-100 aspect-square rounded-lg mb-3 overflow-hidden">
                 <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <h4 className="font-medium text-sm text-primary">{p.name}</h4>
               <div className="flex gap-2 text-sm">
                  {p.onSale ? (
                     <>
                        <span className="text-red-600 font-bold">${p.salePrice}</span>
                        <span className="text-gray-400 line-through">${p.price}</span>
                     </>
                  ) : (
                     <span className="text-gray-500">${p.price}</span>
                  )}
               </div>
             </div>
           ))}
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default ProductDetails;
