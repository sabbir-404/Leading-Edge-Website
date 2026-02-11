import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Save, Plus, Trash2 } from 'lucide-react';
import { CATEGORIES } from '../constants';

const AdminContent: React.FC = () => {
  const { siteConfig, updateSiteConfig } = useShop();
  const [config, setConfig] = useState(siteConfig);
  const [activeSection, setActiveSection] = useState('home');
  const [activeSubTab, setActiveSubTab] = useState('hero');

  const handleSave = () => {
    updateSiteConfig(config);
    alert('Site content updated successfully!');
  };

  // Hero Logic
  const updateHero = (index: number, field: string, value: any) => {
    const updated = [...config.heroSlides];
    updated[index] = { ...updated[index], [field]: value };
    setConfig(prev => ({ ...prev, heroSlides: updated }));
  };

  // Home Sections Logic
  const toggleSectionVisibility = (id: string) => {
      const updated = config.homeSections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s);
      setConfig(prev => ({ ...prev, homeSections: updated }));
  };

  const addSection = () => {
      const newId = `sec-${Date.now()}`;
      setConfig(prev => ({
          ...prev,
          homeSections: [...prev.homeSections, { id: newId, title: 'New Collection', type: 'category', value: 'Furniture', isVisible: true }]
      }));
  };

  const updateSection = (id: string, field: string, value: any) => {
      const updated = config.homeSections.map(s => s.id === id ? { ...s, [field]: value } : s);
      setConfig(prev => ({ ...prev, homeSections: updated }));
  };

  const removeSection = (id: string) => {
      setConfig(prev => ({ ...prev, homeSections: prev.homeSections.filter(s => s.id !== id) }));
  };

  // Catalogue Logic
  const addCatalogue = () => {
      setConfig(prev => ({
          ...prev,
          catalogues: [...prev.catalogues, { id: `cat-${Date.now()}`, title: 'New Catalogue', coverImage: '', pdfUrl: '', season: '2024', description: '' }]
      }));
  };

  const updateCatalogue = (index: number, field: string, value: any) => {
      const updated = [...config.catalogues];
      updated[index] = { ...updated[index], [field]: value };
      setConfig(prev => ({ ...prev, catalogues: updated }));
  };
  
  const removeCatalogue = (index: number) => {
      setConfig(prev => ({ ...prev, catalogues: prev.catalogues.filter((_, i) => i !== index) }));
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
           <h1 className="text-3xl font-bold text-gray-800">Content Management</h1>
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
                 <button onClick={() => setActiveSection('home')} className={`w-full text-left px-6 py-4 font-medium border-l-4 ${activeSection === 'home' ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}>Home Page</button>
                 <button onClick={() => setActiveSection('catalogues')} className={`w-full text-left px-6 py-4 font-medium border-l-4 ${activeSection === 'catalogues' ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}>Catalogues</button>
                 <div className="p-4 bg-gray-50 text-xs text-gray-500 border-t">
                    Note: "About", "Shipping", and "Returns" pages are now managed under the <strong>Pages</strong> tab.
                 </div>
              </div>
           </div>

           <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                 
                 {activeSection === 'home' && (
                    <div>
                        <div className="flex border-b mb-6">
                            <button onClick={() => setActiveSubTab('hero')} className={`px-4 py-2 border-b-2 font-medium ${activeSubTab === 'hero' ? 'border-accent text-accent' : 'border-transparent text-gray-500'}`}>Hero Slider</button>
                            <button onClick={() => setActiveSubTab('sections')} className={`px-4 py-2 border-b-2 font-medium ${activeSubTab === 'sections' ? 'border-accent text-accent' : 'border-transparent text-gray-500'}`}>Product Sections</button>
                        </div>

                        {activeSubTab === 'hero' && (
                            <div className="space-y-8">
                                {config.heroSlides.map((slide, idx) => (
                                    <div key={slide.id} className="border p-6 rounded-lg bg-gray-50">
                                        <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Slide #{idx + 1}</h4>
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
                                            <div>
                                                <label className="block text-xs font-bold mb-1">Text Alignment</label>
                                                <select className="w-full border p-2 rounded" value={slide.alignment || 'center'} onChange={e => updateHero(idx, 'alignment', e.target.value)}>
                                                    <option value="center">Center</option>
                                                    <option value="left-top">Top Left</option>
                                                    <option value="left-bottom">Bottom Left</option>
                                                    <option value="right-top">Top Right</option>
                                                    <option value="right-bottom">Bottom Right</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1">Button Text (Optional)</label>
                                                <input className="w-full border p-2 rounded" value={slide.buttonText || ''} onChange={e => updateHero(idx, 'buttonText', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1">Button Link (Optional)</label>
                                                <input className="w-full border p-2 rounded" value={slide.buttonLink || ''} onChange={e => updateHero(idx, 'buttonLink', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeSubTab === 'sections' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold">Product Sliders</h3>
                                    <button onClick={addSection} className="text-sm bg-accent text-white px-3 py-1 rounded flex items-center gap-1"><Plus size={14}/> Add Section</button>
                                </div>
                                {config.homeSections.map((section) => (
                                    <div key={section.id} className="border p-4 rounded-lg flex flex-col gap-4 bg-gray-50">
                                        <div className="flex justify-between items-center">
                                            <input 
                                                className="font-bold bg-transparent border-b border-gray-300 focus:border-accent outline-none" 
                                                value={section.title} 
                                                onChange={e => updateSection(section.id, 'title', e.target.value)}
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => toggleSectionVisibility(section.id)} className={`text-xs px-2 py-1 rounded font-bold ${section.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                    {section.isVisible ? 'Visible' : 'Hidden'}
                                                </button>
                                                <button onClick={() => removeSection(section.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold mb-1">Content Type</label>
                                                <select className="w-full border p-2 rounded bg-white" value={section.type} onChange={e => updateSection(section.id, 'type', e.target.value)}>
                                                    <option value="category">Category</option>
                                                    <option value="ids">Specific Product IDs</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1">Value</label>
                                                {section.type === 'category' ? (
                                                    <select className="w-full border p-2 rounded bg-white" value={section.value as string} onChange={e => updateSection(section.id, 'value', e.target.value)}>
                                                        {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                    </select>
                                                ) : (
                                                    <input 
                                                        className="w-full border p-2 rounded bg-white" 
                                                        placeholder="comma,separated,ids" 
                                                        value={Array.isArray(section.value) ? section.value.join(',') : section.value} 
                                                        onChange={e => updateSection(section.id, 'value', e.target.value.split(','))}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 )}

                 {activeSection === 'catalogues' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Catalogues</h2>
                            <button onClick={addCatalogue} className="text-sm bg-accent text-white px-3 py-1 rounded flex items-center gap-1"><Plus size={14}/> Add Catalogue</button>
                        </div>
                        {config.catalogues.map((cat, idx) => (
                            <div key={cat.id} className="border p-6 rounded-lg bg-gray-50 relative">
                                <button onClick={() => removeCatalogue(idx)} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold mb-1">Title</label><input className="w-full border p-2 rounded" value={cat.title} onChange={e => updateCatalogue(idx, 'title', e.target.value)} /></div>
                                    <div><label className="block text-xs font-bold mb-1">Season</label><input className="w-full border p-2 rounded" value={cat.season} onChange={e => updateCatalogue(idx, 'season', e.target.value)} /></div>
                                    <div><label className="block text-xs font-bold mb-1">Cover Image</label><input className="w-full border p-2 rounded" value={cat.coverImage} onChange={e => updateCatalogue(idx, 'coverImage', e.target.value)} /></div>
                                    <div><label className="block text-xs font-bold mb-1">PDF URL</label><input className="w-full border p-2 rounded" value={cat.pdfUrl} onChange={e => updateCatalogue(idx, 'pdfUrl', e.target.value)} /></div>
                                    <div className="col-span-2"><label className="block text-xs font-bold mb-1">Description</label><textarea className="w-full border p-2 rounded" value={cat.description} onChange={e => updateCatalogue(idx, 'description', e.target.value)} /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
    </>
  );
};

export default AdminContent;