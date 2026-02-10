import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Shipping: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
         <h1 className="text-4xl font-serif font-bold mb-8 text-primary">Shipping Policy</h1>
         
         <div className="prose prose-lg text-gray-600 space-y-8">
            <section>
               <h2 className="text-xl font-bold text-primary mb-3">Domestic Shipping</h2>
               <p>
                  Leading Edge offers shipping to all 50 states. Orders are typically processed within 1-2 business days. 
                  Standard shipping takes 5-7 business days to arrive.
               </p>
            </section>

            <section>
               <h2 className="text-xl font-bold text-primary mb-3">White Glove Delivery</h2>
               <p>
                  For large furniture items (sofas, beds, dining tables), we utilize a White Glove Delivery service. 
                  The delivery team will bring the item into your home, unpack it, assemble it in your room of choice, and remove all packaging materials.
               </p>
            </section>

            <section>
               <h2 className="text-xl font-bold text-primary mb-3">Shipping Rates</h2>
               <table className="w-full text-left border-collapse mt-4">
                  <thead>
                     <tr className="border-b border-gray-200">
                        <th className="py-2">Order Value</th>
                        <th className="py-2">Standard</th>
                        <th className="py-2">Expedited</th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr className="border-b border-gray-100">
                        <td className="py-2">Under $200</td>
                        <td className="py-2">$15.00</td>
                        <td className="py-2">$35.00</td>
                     </tr>
                     <tr className="border-b border-gray-100">
                        <td className="py-2">$200 - $999</td>
                        <td className="py-2">$45.00</td>
                        <td className="py-2">$85.00</td>
                     </tr>
                     <tr>
                        <td className="py-2">$1000+</td>
                        <td className="py-2 font-bold text-green-600">FREE</td>
                        <td className="py-2">$150.00</td>
                     </tr>
                  </tbody>
               </table>
            </section>
         </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shipping;
