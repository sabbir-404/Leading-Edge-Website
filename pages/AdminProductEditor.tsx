import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import AdminNavbar from '../components/AdminNavbar';
import { Product, ProductVariation, ProductSpecification, ProductTab } from '../types';
import { Save, Eye, ArrowLeft, Plus, Trash2, Image as ImageIcon, EyeOff } from 'lucide-react';
import ProductDetails from './ProductDetails'; // Reusing for preview (hacky but works if mocked context)

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const AdminProductEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addProduct, updateProduct } = useShop();
  const [activeTab, setActiveTab] = useState('general');
  const [showPreview, setShowPreview] = useState(false);

  // Initial State
  const [formData, setFormData] = useState<Product>({
    id: `PROD-${Date.now()}`,
    name: '',
    category: 'Furniture',
    price: 0,
    shortDescription: '',
    description: '',
    modelNumber: '',
    image: '',
    images: [],
    rating: 5,
    features: [],
    isVisible: true,
    variations: [],
    specifications: [],
    customTabs: []
  });

  useEffect(() => {
    if (id && id !== 'new') {
      const found = products.find(p => p.id === id);
      if (found) {
        setFormData(JSON.parse(JSON.stringify(found))); // Deep copy
      }
    }
  }, [id, products]);

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (id === 'new') {
      addProduct(formData);
    } else {
      updateProduct(formData);
    }
    navigate('/admin');
  };

  // Variations Logic
  const addVariation = () => {
    const newVar: ProductVariation = {
      id: generateId(),
      type: 'Color',
      value: '',
      price: formData.price,
    };
    setFormData(prev => ({ ...prev, variations: [...prev.variations, newVar] }));
  };

  const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    const updated = [...formData.variations];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, variations: updated }));
  };

  const removeVariation = (index: number) => {
    setFormData(prev => ({ ...prev, variations: prev.variations.filter((_, i) => i !== index) }));
  };

  // Specs Logic
  const addSpec = () => {
    setFormData(prev => ({ ...prev, specifications: [...prev.specifications, { key: '', value: '' }] }));
  };
  const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...formData.specifications];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, specifications: updated }));
  };
  const removeSpec = (index: number) => {
     setFormData(prev => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== index) }));
  };

  // Tabs Logic
  const addCustomTab = () => {
     setFormData(prev => ({ ...prev, customTabs: [...prev.customTabs, { id: generateId(), title: 'New Tab', content: '' }] }));
  };
  const updateCustomTab = (index: number, field: keyof ProductTab, value: string) => {
    const updated = [...formData.customTabs];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, customTabs: updated }));
  };
  const removeCustomTab = (index: number) => {
    setFormData(prev => ({ ...prev, customTabs: prev.customTabs.filter((_, i) => i !== index) }));
  };

  // Image Gallery Logic
  const addGalleryImage = () => {
    setFormData(prev => ({ ...prev, images: [...(prev.images || []), ''] }));
  };
  const updateGalleryImage = (index: number, value: string) => {
    const updated = [...(formData.images || [])];
    updated[index] = value;
    setFormData(prev => ({ ...prev, images: updated }));
  };
  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) }));
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/admin')} className="flex items-center text-gray-500 hover:text-gray-800">
            <ArrowLeft size={20} className="mr-2" /> Back to Products
          </button>
          <div className="flex gap-4">
             <button 
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 flex items-center gap-2"
             >
               <Eye size={18} /> Preview
             </button>
             <button 
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-200"
             >
               <Save size={18} /> {id === 'new' ? 'Create Product' : 'Update Product'}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button 
                  onClick={() => setActiveTab('general')}
                  className={`w-full text-left px-6 py-4 font-medium border-l-4 ${activeTab === 'general' ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}
                >
                  General Info
                </button>
                <button 
                  onClick={() => setActiveTab('images')}
                  className={`w-full text-left px-6 py-4 font-medium border-l-4 ${activeTab === 'images' ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}
                >
                  Images & Media
                </button>
                <button 
                  onClick={() => setActiveTab('variations')}
                  className={`w-full text-left px-6 py-4 font-medium border-l-4 ${activeTab === 'variations' ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}
                >
                  Variations
                </button>
                <button 
                  onClick={() => setActiveTab('specs')}
                  className={`w-full text-left px-6 py-4 font-medium border-l-4 ${activeTab === 'specs' ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}
                >
                  Specifications
                </button>
                <button 
                  onClick={() => setActiveTab('tabs')}
                  className={`w-full text-left px-6 py-4 font-medium border-l-4 ${activeTab === 'tabs' ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}
                >
                  Custom Tabs
                </button>
             </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                
                {activeTab === 'general' && (
                   <div className="space-y-6">
                      <div className="flex justify-between">
                         <h2 className="text-xl font-bold">General Information</h2>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={formData.isVisible} 
                              onChange={(e) => handleChange('isVisible', e.target.checked)}
                              className="w-5 h-5 accent-accent"
                            />
                            <span className="font-medium">Product Visible</span>
                         </label>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                         <input className="w-full border p-3 rounded-lg" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                            <select className="w-full border p-3 rounded-lg" value={formData.category} onChange={e => handleChange('category', e.target.value)}>
                               {['Furniture', 'Light', 'Kitchenware', 'Hardware', 'Decor', 'Outdoor', 'Rugs', 'Bath'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Model Number</label>
                            <input className="w-full border p-3 rounded-lg" value={formData.modelNumber} onChange={e => handleChange('modelNumber', e.target.value)} />
                         </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Regular Price ($)</label>
                            <input type="number" className="w-full border p-3 rounded-lg" value={formData.price} onChange={e => handleChange('price', Number(e.target.value))} />
                         </div>
                         <div className="flex items-end pb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={formData.onSale} onChange={e => handleChange('onSale', e.target.checked)} className="w-5 h-5 accent-red-600" />
                              <span className="font-bold text-red-600">On Sale</span>
                            </label>
                         </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Sale Price ($)</label>
                            <input type="number" disabled={!formData.onSale} className="w-full border p-3 rounded-lg disabled:bg-gray-100" value={formData.salePrice || ''} onChange={e => handleChange('salePrice', Number(e.target.value))} />
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">Short Description</label>
                         <input className="w-full border p-3 rounded-lg" value={formData.shortDescription} onChange={e => handleChange('shortDescription', e.target.value)} />
                         <p className="text-xs text-gray-400 mt-1">Shown in lists and summaries.</p>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">Long Description</label>
                         <textarea className="w-full border p-3 rounded-lg h-32" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                         <p className="text-xs text-gray-400 mt-1">Main detailed description on product page.</p>
                      </div>
                   </div>
                )}

                {activeTab === 'images' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Images</h2>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail / Main Image URL</label>
                      <div className="flex gap-4">
                         <div className="w-20 h-20 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
                            {formData.image && <img src={formData.image} className="w-full h-full object-cover" />}
                         </div>
                         <input className="w-full border p-3 rounded-lg h-12" value={formData.image} onChange={e => handleChange('image', e.target.value)} placeholder="https://..." />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                       <label className="block text-sm font-bold text-gray-700 mb-4">Gallery Images</label>
                       {formData.images?.map((img, idx) => (
                          <div key={idx} className="flex gap-4 mb-4 items-center">
                             <div className="w-16 h-16 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
                                {img && <img src={img} className="w-full h-full object-cover" />}
                             </div>
                             <input className="w-full border p-2 rounded-lg" value={img} onChange={e => updateGalleryImage(idx, e.target.value)} />
                             <button onClick={() => removeGalleryImage(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 /></button>
                          </div>
                       ))}
                       <button onClick={addGalleryImage} className="text-accent font-bold text-sm flex items-center gap-2 hover:underline"><Plus size={16} /> Add Gallery Image</button>
                    </div>
                  </div>
                )}

                {activeTab === 'variations' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                       <h2 className="text-xl font-bold">Product Variations</h2>
                       <button onClick={addVariation} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm font-medium flex items-center gap-1">
                          <Plus size={14} /> Add Variation
                       </button>
                    </div>
                    {formData.variations.length === 0 ? (
                      <p className="text-gray-400 text-center py-8 bg-gray-50 rounded-lg">No variations added. This product is a simple product.</p>
                    ) : (
                      <div className="space-y-6">
                         {formData.variations.map((v, idx) => (
                           <div key={v.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-2">
                                 <h3 className="font-bold text-gray-700">Variation #{idx + 1}</h3>
                                 <button onClick={() => removeVariation(idx)} className="text-red-500 text-sm hover:underline">Remove</button>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                 <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Type (e.g. Color)</label>
                                    <input className="w-full border p-2 rounded bg-white" value={v.type} onChange={e => updateVariation(idx, 'type', e.target.value)} />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Value (e.g. Red)</label>
                                    <input className="w-full border p-2 rounded bg-white" value={v.value} onChange={e => updateVariation(idx, 'value', e.target.value)} />
                                 </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                 <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Price Override (Opt)</label>
                                    <input type="number" className="w-full border p-2 rounded bg-white" value={v.price || ''} onChange={e => updateVariation(idx, 'price', Number(e.target.value))} placeholder={formData.price.toString()} />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Sale Price (Opt)</label>
                                    <input type="number" className="w-full border p-2 rounded bg-white" value={v.salePrice || ''} onChange={e => updateVariation(idx, 'salePrice', Number(e.target.value))} />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Model # (Opt)</label>
                                    <input className="w-full border p-2 rounded bg-white" value={v.modelNumber || ''} onChange={e => updateVariation(idx, 'modelNumber', e.target.value)} placeholder={formData.modelNumber} />
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Image Override URL (Opt)</label>
                                 <input className="w-full border p-2 rounded bg-white" value={v.image || ''} onChange={e => updateVariation(idx, 'image', e.target.value)} />
                              </div>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'specs' && (
                   <div>
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Specifications</h2>
                        <button onClick={addSpec} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm font-medium flex items-center gap-1"><Plus size={14} /> Add Row</button>
                     </div>
                     <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                           <thead className="bg-gray-100 border-b">
                              <tr>
                                 <th className="p-3 w-1/3">Specification Name</th>
                                 <th className="p-3">Value</th>
                                 <th className="p-3 w-16"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y">
                              {formData.specifications.map((spec, idx) => (
                                 <tr key={idx}>
                                    <td className="p-2"><input className="w-full border p-2 rounded" value={spec.key} onChange={e => updateSpec(idx, 'key', e.target.value)} placeholder="e.g. Material" /></td>
                                    <td className="p-2"><input className="w-full border p-2 rounded" value={spec.value} onChange={e => updateSpec(idx, 'value', e.target.value)} placeholder="e.g. Oak Wood" /></td>
                                    <td className="p-2 text-center"><button onClick={() => removeSpec(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                        {formData.specifications.length === 0 && <p className="text-center py-4 text-gray-400">No specifications added.</p>}
                     </div>
                   </div>
                )}

                {activeTab === 'tabs' && (
                  <div>
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Custom Info Tabs</h2>
                        <button onClick={addCustomTab} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm font-medium flex items-center gap-1"><Plus size={14} /> Add Tab</button>
                     </div>
                     <div className="space-y-6">
                        {formData.customTabs.map((tab, idx) => (
                           <div key={tab.id} className="border p-4 rounded-lg">
                              <div className="flex justify-between mb-2">
                                 <input className="font-bold border-b border-dashed border-gray-400 focus:outline-none focus:border-accent" value={tab.title} onChange={e => updateCustomTab(idx, 'title', e.target.value)} placeholder="Tab Title" />
                                 <button onClick={() => removeCustomTab(idx)} className="text-red-500 text-xs"><Trash2 size={14} /></button>
                              </div>
                              <textarea className="w-full border rounded p-2 text-sm" rows={4} value={tab.content} onChange={e => updateCustomTab(idx, 'content', e.target.value)} placeholder="Tab content goes here..." />
                           </div>
                        ))}
                     </div>
                  </div>
                )}

             </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
         <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
               <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
                  <h3 className="font-bold">Preview Mode: {formData.name}</h3>
                  <button onClick={() => setShowPreview(false)} className="hover:text-gray-300"><EyeOff /></button>
               </div>
               <div className="flex-1 overflow-y-auto bg-white relative">
                  {/* Mocking the preview by injecting the form data into a view */}
                  {/* Note: In a real app we'd reuse ProductDetails component but passed with data prop. 
                      Since ProductDetails fetches from URL ID, we can't easily reuse it without refactoring.
                      For now, I will create a temporary Save to ID 'preview' and show that? No, that dirties state.
                      I'll just let the user save to see it, or implement a basic preview here. 
                  */}
                  <div className="p-10 text-center">
                     <p className="mb-4 text-gray-600">
                        (Preview functionality is simulated. In a real environment, this would render the ProductDetails component with the current form data passed as props.)
                     </p>
                     <p>Product: <strong>{formData.name}</strong></p>
                     <p>Price: <strong>${formData.price}</strong></p>
                     <p>Variations: <strong>{formData.variations.length}</strong></p>
                     <button onClick={handleSave} className="mt-4 bg-green-600 text-white px-6 py-2 rounded">Save & View Live</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default AdminProductEditor;