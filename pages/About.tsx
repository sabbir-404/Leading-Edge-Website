import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Video Hero */}
      <div className="w-full aspect-video md:h-[500px] bg-black relative">
         <div className="absolute inset-0 flex items-center justify-center">
            {/* Placeholder for Video Player */}
            <div className="text-white text-center">
               <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur border border-white flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
               </div>
               <h1 className="text-4xl md:text-5xl font-serif font-bold">Our Story</h1>
               <p className="mt-2 text-lg text-gray-300">Watch the Leading Edge Showroom Tour</p>
            </div>
         </div>
         <img 
            src="https://picsum.photos/seed/showroom/1920/1080" 
            alt="Showroom" 
            className="w-full h-full object-cover opacity-50"
         />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
         <h2 className="text-3xl font-serif font-bold text-primary mb-8">Crafting the Future of Living</h2>
         <p className="text-lg text-gray-600 leading-relaxed mb-6">
            Founded in 2024, Leading Edge was born from a desire to bridge the gap between high-concept art and functional living. We believe that furniture shouldn't just fill a space; it should define it.
         </p>
         <p className="text-lg text-gray-600 leading-relaxed">
            Our curators travel the globe to find pieces that speak to the modern soul—minimalist yet bold, sustainable yet luxurious. Every item in our collection is handpicked to ensure it meets our rigorous standards for quality and design.
         </p>
      </div>

      <div className="bg-gray-50 py-16">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
               <h3 className="text-xl font-bold mb-3">Sustainable Sourcing</h3>
               <p className="text-gray-500">We work with eco-conscious manufacturers who prioritize renewable materials.</p>
            </div>
            <div className="p-6">
               <h3 className="text-xl font-bold mb-3">Artistic Integrity</h3>
               <p className="text-gray-500">Designs that stand the test of time, moving beyond fleeting trends.</p>
            </div>
            <div className="p-6">
               <h3 className="text-xl font-bold mb-3">Customer First</h3>
               <p className="text-gray-500">From browsing to delivery, your experience is our top priority.</p>
            </div>
         </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
