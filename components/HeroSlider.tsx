import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../context/ShopContext';

const HeroSlider: React.FC = () => {
  const { siteConfig } = useShop();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % siteConfig.heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [siteConfig.heroSlides.length]);

  if (siteConfig.heroSlides.length === 0) return null;

  return (
    <div className="w-full bg-white">
      <div className="relative w-full aspect-video md:aspect-[21/9] lg:h-[600px] lg:aspect-auto overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img 
              src={siteConfig.heroSlides[current].image} 
              alt={siteConfig.heroSlides[current].title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-start p-8 md:p-20">
               <div className="max-w-xl text-white">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    className="text-3xl md:text-6xl font-serif font-bold mb-4"
                  >
                     {siteConfig.heroSlides[current].title}
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-xl font-light opacity-90"
                  >
                     {siteConfig.heroSlides[current].subtitle}
                  </motion.p>
               </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HeroSlider;