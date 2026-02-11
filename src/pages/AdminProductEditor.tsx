import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Product, ProductVariation, ProductSpecification, ProductTab, SpecificShippingCharge } from '../types';
import { Save, Eye, ArrowLeft, Plus, Trash2, CheckSquare, Square, Upload, Image as ImageIcon } from 'lucide-react';
import { CURRENCY } from '../constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

const AdminProductEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, categories, addProduct, updateProduct, shippingAreas, showToast } = useShop();
  const [activeTab, setActiveTab] = useState('general');
  const [showPreview, setShowPreview] = useState(false);

  // Initial State
  const [formData, setFormData] = useState<Product>({
    id: `PROD-${Date.now()}`,
    name: '',
    categories: ['Furniture'], // Default category
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
    customTabs: [],
    weight: 0,
    specificShippingCharges: []
  });

  // Local state for adding variations
  const [newVarType, setNewVarType] = useState('Color');

  useEffect(() => {
    if (id && id !== 'new') {
      const found = products.find(p => p.id === id);
      if (found) {
        setFormData(JSON.parse(JSON.stringify(found)));
      }
    }
  }, [id, products]);

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => {
        const cats = prev.categories || [];
        if (cats.includes(category)) {
            return { ...prev, categories: cats.filter(c => c !== category) };
        } else {
            return { ...prev, categories: [...cats, category] };
        }
    });
  };

  const handleSave = () => {
    if (formData.categories.length === 0) {
        showToast('Please select at least one category', 'error');
        return;
    }
    
    if (id === 'new') {
      addProduct(formData);
    } else {
      updateProduct(formData);
    }
    // Stay on page and show notification is handled by context actions mostly, 
    // but context actions for add/update product currently show toast.
    // We will just wait.
  };

  // Grouped Variations Logic
  const getUniqueTypes = () => Array.from(new Set(formData.variations.map(v => v.type)));
  
  const addVariation = (type: string) => {
    const newVar: ProductVariation = { 
        id: generateId(), 
        type, 
        value: 'New Option', 
        price: formData.price,
        modelNumber: formData.modelNumber
    };
    setFormData(prev => ({ ...prev, variations: [...prev.variations, newVar] }));
  };

  const updateVariation = (id: string, field: keyof ProductVariation, value: any) => {
    setFormData(prev => ({
        ...prev,
        variations: prev.variations.map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
  };

  const removeVariation = (id: string) => {
    setFormData(prev => ({ ...prev, variations: prev.variations.filter(v => v.id !== id) }));
  };

  // Other handlers (Specs, Tabs, Gallery, Shipping) remain largely same
  const addSpec = () => setFormData(prev => ({ ...prev, specifications: [...prev.specifications, { key: '', value: '' }] }));
  const updateSpec = (idx: number, field: 'key' | 'value', value: string) => {
    const updated = [...formData.specifications];
    updated[idx][field] = value;
    setFormData(prev => ({ ...prev, specifications: updated }));
  };
  const removeSpec = (idx: number) => setFormData(prev => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== idx) }));

  const addCustomTab = () => setFormData(prev => ({ ...prev, customTabs: [...prev.customTabs, { id: generateId(), title: 'New Tab', content: '' }] }));
  const updateCustomTab = (idx: number, field: keyof ProductTab, value: string) => {
    const updated = [...formData.customTabs];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData(prev => ({ ...prev, customTabs: updated }));
  };
  const removeCustomTab = (idx: number) => setFormData(prev => ({ ...prev, customTabs: prev.customTabs.filter((_, i) => i !== idx) }));

  const addGalleryImage = () => setFormData(prev => ({ ...prev, images: [...(prev.images || []), ''] }));
  const updateGalleryImage = (idx: number, value: string) => {
    const updated = [...(formData.images || [])];
    updated[idx] = value;
    setFormData(prev => ({ ...prev, images: updated }));
  };
  const removeGalleryImage = (idx: number) => setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }));

  // File Upload Handlers
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ 
                ...prev, 
                images: [...(prev.images || []), reader.result as string] 
            }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const addShippingCharge = () => setFormData(prev => ({ ...prev, specificShippingCharges: [...(prev.specificShippingCharges || []), { areaId: shippingAreas[0]?.id || '', charge: 0 }] }));
  const updateShippingCharge = (idx: number, field: keyof SpecificShippingCharge, value: any) => {
      const updated = [...(formData.specificShippingCharges || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      setFormData(prev => ({ ...prev, specificShippingCharges: updated }));
  };
  const removeShippingCharge = (idx: number) => setFormData(prev => ({ ...prev, specificShippingCharges: prev.specificShippingCharges?.filter((_, i) => i !== idx) }));

  // Get available categories from context, filtered to main categories and sorted by order
  const availableCategories = categories
    .filter(c => !c.parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => c.name);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/admin')} className="flex items-center text-gray-500 hover:text-gray-800">
            <ArrowLeft size={20} className="mr-2" /> Back to Products
          </button>
          <div className="flex gap-4">
             <button onClick={() => setShowPreview(true)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 flex items-center gap-2">
               <Eye size={18} /> Preview
             </button>
             <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg">
               <Save size={18} /> {id === 'new' ? 'Create' : 'Update'}
             </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                {['general', 'images', 'variations', 'specs', 'tabs', 'shipping'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`w-full text-left px-6 py-4 font-medium border-l-4 capitalize ${activeTab === tab ? 'border-accent bg-orange-50 text-accent' : 'border-transparent hover:bg-gray-50'}`}
                    >
                        {tab === 'specs' ? 'Specifications' : tab === 'tabs' ? 'Custom Tabs' : tab}
                    </button>
                ))}
             </div>
          </div>

          <div className="lg:col-span-3">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                
                {activeTab === 'general' && (
                   <div className="space-y-6">
                      <div className="flex justify-between">
                         <h2 className="text-xl font-bold">General Information</h2>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.isVisible} onChange={(e) => handleChange('isVisible', e.target.checked)} className="w-5 h-5 accent-accent" />
                            <span className="font-medium">Product Visible</span>
                         </label>
                      </div>
                      <div><label className="block text-sm font-bold mb-2">Name</label><input className="w-full border p-3 rounded" value={formData.name} onChange={e => handleChange('name', e.target.value)} /></div>
                      
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-bold mb-2">Categories (Select All applicable)</label>
                            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
                                {availableCategories.length === 0 ? <p className="text-gray-500 text-sm">No categories found.</p> : null}
                                {availableCategories.map(c => (
                                    <label key={c} className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                        <div onClick={(e) => { e.preventDefault(); handleCategoryChange(c); }}>
                                            {formData.categories.includes(c) ? <CheckSquare size={18} className="text-accent"/> : <Square size={18} className="text-gray-400"/>}
                                        </div>
                                        <span className={formData.categories.includes(c) ? 'font-bold text-gray-800' : 'text-gray-600'}>{c}</span>
                                    </label>
                                ))}
                            </div>
                         </div>
                         <div><label className="block text-sm font-bold mb-2">Model Number</label><input className="w-full border p-3 rounded" value={formData.modelNumber} onChange={e => handleChange('modelNumber', e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                         <div><label className="block text-sm font-bold mb-2">Price ({CURRENCY})</label><input type="number" className="w-full border p-3 rounded" value={formData.price} onChange={e => handleChange('price', Number(e.target.value))} /></div>
                         <div className="flex items-end pb-3"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.onSale} onChange={e => handleChange('onSale', e.target.checked)} className="w-5 h-5 accent-red-600" /><span className="font-bold text-red-600">On Sale</span></label></div>
                         <div><label className="block text-sm font-bold mb-2">Sale Price ({CURRENCY})</label><input type="number" disabled={!formData.onSale} className="w-full border p-3 rounded disabled:bg-gray-100" value={formData.salePrice || ''} onChange={e => handleChange('salePrice', Number(e.target.value))} /></div>
                      </div>
                      <div><label className="block text-sm font-bold mb-2">Short Desc</label><input className="w-full border p-3 rounded" value={formData.shortDescription} onChange={e => handleChange('shortDescription', e.target.value)} /></div>
                      <div><label className="block text-sm font-bold mb-2">Long Desc</label><textarea className="w-full border p-3 rounded h-32" value={formData.description} onChange={e => handleChange('description', e.target.value)} /></div>
                   </div>
                )}

                {activeTab === 'images' && (
                  <div className="space-y-8">
                    {/* Thumbnail Section */}
                    <div>
                      <h2 className="text-xl font-bold mb-4">Thumbnail</h2>
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="w-40 h-40 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={48} />}
                          </div>
                          <div className="flex-1 w-full space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Image URL</label>
                                  <input className="w-full border p-3 rounded" value={formData.image} onChange={e => handleChange('image', e.target.value)} placeholder="https://..." />
                              </div>
                              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors group cursor-pointer">
                                  <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                  <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-accent transition-colors">
                                      <Upload size={20} />
                                      <span className="font-medium">Upload from computer</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                    </div>

                    <div className="border-t pt-8">
                       <div className="flex justify-between items-center mb-6">
                           <h2 className="text-xl font-bold">Gallery Images</h2>
                       </div>
                       
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                           {formData.images?.map((img, idx) => (
                              <div key={idx} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                 <img src={img} className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                     <button onClick={() => removeGalleryImage(idx)} className="bg-white text-red-500 p-2 rounded-full hover:bg-red-50"><Trash2 size={16} /></button>
                                 </div>
                                 <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-1">
                                     <input className="w-full text-xs bg-transparent border-none p-1 focus:outline-none truncate" value={img} onChange={e => updateGalleryImage(idx, e.target.value)} />
                                 </div>
                              </div>
                           ))}
                       </div>

                       <div className="flex flex-col md:flex-row gap-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                           <div className="flex-1">
                               <h4 className="font-bold text-gray-700 mb-2">Add via URL</h4>
                               <button onClick={addGalleryImage} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 w-full flex items-center justify-center gap-2">
                                   <Plus size={16} /> Add Empty Row
                               </button>
                           </div>
                           <div className="flex items-center justify-center">
                               <span className="text-gray-400 font-bold text-sm">OR</span>
                           </div>
                           <div className="flex-1">
                               <h4 className="font-bold text-gray-700 mb-2">Upload Files</h4>
                               <div className="relative border-2 border-dashed border-gray-300 bg-white rounded-lg p-2 text-center hover:border-accent transition-colors cursor-pointer h-[42px] flex items-center justify-center">
                                  <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                                      <Upload size={16} />
                                      <span>Select files</span>
                                  </div>
                               </div>
                           </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'variations' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Variations</h2>
                    
                    {/* Add New Type Box */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-8 flex items-center gap-4">
                        <span className="font-bold text-sm">Create Group:</span>
                        <input className="border p-2 rounded w-40" placeholder="e.g. Color, Size" value={newVarType} onChange={e => setNewVarType(e.target.value)} />
                        <button onClick={() => addVariation(newVarType)} className="bg-accent text-white px-3 py-2 rounded text-sm font-bold">Start Group</button>
                    </div>

                    {getUniqueTypes().map(type => (
                        <div key={type} className="border rounded-xl p-6 mb-6">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="font-bold text-lg">{type}</h3>
                                <button onClick={() => addVariation(type)} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded flex items-center gap-1"><Plus size={14}/> Add {type}</button>
                            </div>
                            
                            <div className="space-y-3">
                                {formData.variations.filter(v => v.type === type).map(v => (
                                    <div key={v.id} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-gray-50 p-3 rounded">
                                        <div className="w-full md:w-auto md:flex-1">
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Value</label>
                                            <input className="w-full border p-1 rounded bg-white" value={v.value} onChange={e => updateVariation(v.id, 'value', e.target.value)} placeholder="e.g. Red" />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Price</label>
                                            <input type="number" className="w-full border p-1 rounded bg-white" value={v.price} onChange={e => updateVariation(v.id, 'price', Number(e.target.value))} />
                                        </div>
                                        <div className="w-32">
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Model #</label>
                                            <input className="w-full border p-1 rounded bg-white" value={v.modelNumber || ''} onChange={e => updateVariation(v.id, 'modelNumber', e.target.value)} />
                                        </div>
                                        <button onClick={() => removeVariation(v.id)} className="text-red-500 hover:bg-red-50 p-2 rounded mt-4"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {formData.variations.length === 0 && <p className="text-center text-gray-400">No variations defined.</p>}
                  </div>
                )}

                {activeTab === 'specs' && (
                   <div>
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Specifications</h2>
                        <button onClick={addSpec} className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm font-bold flex items-center gap-1"><Plus size={14} /> Add Row</button>
                     </div>
                     <table className="w-full text-left">
                        <tbody className="divide-y">
                           {formData.specifications.map((spec, idx) => (
                              <tr key={idx}>
                                 <td className="p-2"><input className="w-full border p-2 rounded" value={spec.key} onChange={e => updateSpec(idx, 'key', e.target.value)} placeholder="Key" /></td>
                                 <td className="p-2"><input className="w-full border p-2 rounded" value={spec.value} onChange={e => updateSpec(idx, 'value', e.target.value)} placeholder="Value" /></td>
                                 <td className="p-2 text-center"><button onClick={() => removeSpec(idx)} className="text-red-500"><Trash2 size={16} /></button></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                )}

                {activeTab === 'tabs' && (
                  <div>
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Custom Tabs</h2>
                        <button onClick={addCustomTab} className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm font-bold flex items-center gap-1"><Plus size={14} /> Add Tab</button>
                     </div>
                     <div className="space-y-6">
                        {formData.customTabs.map((tab, idx) => (
                           <div key={tab.id} className="border p-4 rounded-lg relative">
                              <button onClick={() => removeCustomTab(idx)} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
                              <input className="font-bold border-b mb-2 w-full outline-none" value={tab.title} onChange={e => updateCustomTab(idx, 'title', e.target.value)} placeholder="Tab Title" />
                              <textarea className="w-full border rounded p-2" rows={4} value={tab.content} onChange={e => updateCustomTab(idx, 'content', e.target.value)} placeholder="Content" />
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                {activeTab === 'shipping' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold mb-4">Weight</h2>
                            <label className="block text-sm font-bold mb-2">Product Weight (kg)</label>
                            <input type="number" className="w-full border p-3 rounded-lg max-w-xs" value={formData.weight || 0} onChange={e => handleChange('weight', Number(e.target.value))} />
                        </div>
                        <div className="border-t pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Specific Charges</h2>
                                <button onClick={addShippingCharge} className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm font-bold flex items-center gap-1"><Plus size={14} /> Add Charge</button>
                            </div>
                            {formData.specificShippingCharges?.map((charge, idx) => (
                                <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded mb-2">
                                    <select className="flex-1 border p-2 rounded" value={charge.areaId} onChange={(e) => updateShippingCharge(idx, 'areaId', e.target.value)}>
                                        {shippingAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
                                    </select>
                                    <input type="number" className="w-32 border p-2 rounded" value={charge.charge} onChange={(e) => updateShippingCharge(idx, 'charge', Number(e.target.value))} />
                                    <button onClick={() => removeShippingCharge(idx)} className="text-red-500"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

             </div>
          </div>
      </div>
      
      {showPreview && (
         <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg">
               <h3 className="font-bold mb-4">Preview Simulated</h3>
               <button onClick={() => setShowPreview(false)} className="bg-gray-800 text-white px-4 py-2 rounded">Close</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default AdminProductEditor;