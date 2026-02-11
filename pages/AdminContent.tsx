import React, { useState } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { useShop } from '../context/ShopContext';
import { Save } from 'lucide-react';

const AdminContent: React.FC = () => {
  const { siteConfig, updateSiteConfig } = useShop();
  const [config, setConfig] = useState(siteConfig);
  const [activeSection, setActiveSection] = useState('home');

  const handleSave = () => {
    updateSiteConfig(config);
    alert('Site content updated successfully!');
  };

  const updateHero = (index: number, field: string, value: string) => {
    const updated = [...config.heroSlides];
    updated[index] = { ...updated[index], [field]: value };
    setConfig(prev => ({ ...prev, heroSlides: updated }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-3xl font-bold text-gray-800">Site Content Editor</h1>
           <button 
             onClick={handleSave}
             className="bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 font-bold shadow-lg"
           >
             <Save size={20} /> Save Changes
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <button onClick={() => setActiveSection('home')} className={`w-full text-left px-6 py-4 font-medium border-l-4 ${activeSection === 'home' ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}>Home Page (Hero)</button>
                 <button onClick={() => setActiveSection('about')} className={`w-full text-left px-6 py-4 font-medium border-l-4 ${activeSection === 'about' ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}>About Us</button>
                 <button onClick={() => setActiveSection('policies')} className={`w-full text-left px-6 py-4 font-medium border-l-4 ${activeSection === 'policies' ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}>Policies</button>
              </div>
           </div>

           <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                 {activeSection === 'home' && (
                    <div className="space-y-8">
                       <h2 className="text-2xl font-bold mb-4">Hero Slider Images</h2>
                       {config.heroSlides.map((slide, idx) => (
                          <div key={slide.id} className="border p-4 rounded-lg bg-gray-50">
                             <h4 className="font-bold text-gray-500 mb-2">Slide #{idx + 1}</h4>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                   <label className="block text-xs font-bold mb-1">Image URL</label>
                                   <input className="w-full border p-2 rounded" value={slide.image} onChange={e => updateHero(idx, 'image', e.target.value)} />
                                </div>
                                <div>
                                   <label className="block text-xs font-bold mb-1">Title</label>
                                   <input className="w-full border p-2 rounded" value={slide.title} onChange={e => updateHero(idx, 'title', e.target.value)} />
                                </div>
                                <div>
                                   <label className="block text-xs font-bold mb-1">Subtitle</label>
                                   <input className="w-full border p-2 rounded" value={slide.subtitle} onChange={e => updateHero(idx, 'subtitle', e.target.value)} />
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}

                 {activeSection === 'about' && (
                    <div className="space-y-6">
                       <h2 className="text-2xl font-bold">About Page Content</h2>
                       <div>
                          <label className="block font-bold mb-2">Page Title</label>
                          <input className="w-full border p-3 rounded" value={config.about.title} onChange={e => setConfig({...config, about: {...config.about, title: e.target.value}})} />
                       </div>
                       <div>
                          <label className="block font-bold mb-2">Hero Image</label>
                          <input className="w-full border p-3 rounded" value={config.about.image} onChange={e => setConfig({...config, about: {...config.about, image: e.target.value}})} />
                       </div>
                       <div>
                          <label className="block font-bold mb-2">Main Content</label>
                          <textarea className="w-full border p-3 rounded h-40" value={config.about.content} onChange={e => setConfig({...config, about: {...config.about, content: e.target.value}})} />
                       </div>
                    </div>
                 )}

                 {activeSection === 'policies' && (
                    <div className="space-y-8">
                       <h2 className="text-2xl font-bold">Policy Pages</h2>
                       
                       <div>
                          <h3 className="text-lg font-bold mb-3 text-accent">Shipping Policy</h3>
                          <textarea className="w-full border p-3 rounded h-40" value={config.shipping.content} onChange={e => setConfig({...config, shipping: { content: e.target.value }})} />
                       </div>

                       <div>
                          <h3 className="text-lg font-bold mb-3 text-accent">Returns Policy</h3>
                          <textarea className="w-full border p-3 rounded h-40" value={config.returns.content} onChange={e => setConfig({...config, returns: { content: e.target.value }})} />
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContent;