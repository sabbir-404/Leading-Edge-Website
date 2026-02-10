import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Returns: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
         <h1 className="text-4xl font-serif font-bold mb-8 text-primary">Exchange & Return Policy</h1>
         
         <div className="prose prose-lg text-gray-600 space-y-8">
            <section>
               <h2 className="text-xl font-bold text-primary mb-3">30-Day Happiness Guarantee</h2>
               <p>
                  We want you to be completely satisfied with your purchase. If you are not happy with your item, you may return it within 30 days of receiving your order for a full refund or exchange.
               </p>
            </section>

            <section>
               <h2 className="text-xl font-bold text-primary mb-3">Eligibility</h2>
               <ul className="list-disc pl-5 space-y-2">
                  <li>Items must be unused, unwashed, and in their original condition.</li>
                  <li>Original packaging must be intact.</li>
                  <li>Proof of purchase is required.</li>
               </ul>
            </section>

            <section>
               <h2 className="text-xl font-bold text-primary mb-3">Non-Returnable Items</h2>
               <p>
                  Custom-made furniture, clearance items, and gift cards are final sale and cannot be returned.
               </p>
            </section>

            <section className="bg-gray-50 p-6 rounded-lg border border-gray-100">
               <h2 className="text-xl font-bold text-primary mb-3">How to Initiate a Return</h2>
               <p className="mb-4">
                  To start a return, please contact our support team at <strong className="text-primary">support@leadingedge.com</strong> with your order number.
               </p>
               <button className="bg-primary text-white px-6 py-2 rounded hover:bg-accent transition-colors">Contact Support</button>
            </section>
         </div>
      </div>
      <Footer />
    </div>
  );
};

export default Returns;
