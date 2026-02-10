import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useShop } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { Product } from '../types';

const Admin: React.FC = () => {
  const { user, products, deleteProduct, addProduct, updateProduct } = useShop();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});

  useEffect(() => {
    // Basic Admin Protection
    if (!user || !user.email.includes('admin')) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEdit = (product: Product) => {
    setFormData(product);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setFormData({
      id: `new-${Date.now()}`,
      name: '',
      price: 0,
      category: 'Furniture',
      modelNumber: '',
      image: 'https://picsum.photos/seed/new/600/600',
      description: '',
      onSale: false,
      features: []
    });
    setIsEditing(true);
  };

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id && formData.name) {
      const exists = products.find(p => p.id === formData.id);
      if (exists) {
        updateProduct(formData as Product);
      } else {
        addProduct(formData as Product);
      }
      setIsEditing(false);
    }
  };

  if (!user || !user.email.includes('admin')) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button 
            onClick={handleAddNew}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus size={18} /> Add Product
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-medium text-gray-500">Image</th>
                <th className="p-4 font-medium text-gray-500">Name</th>
                <th className="p-4 font-medium text-gray-500">Model</th>
                <th className="p-4 font-medium text-gray-500">Price</th>
                <th className="p-4 font-medium text-gray-500">Category</th>
                <th className="p-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <img src={p.image} className="w-12 h-12 rounded object-cover" />
                  </td>
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-sm text-gray-500">{p.modelNumber}</td>
                  <td className="p-4">${p.price}</td>
                  <td className="p-4 text-sm bg-gray-100 rounded-full px-2 py-1 inline-block mt-3 mx-4">{p.category}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Edit Product</h2>
                <button onClick={() => setIsEditing(false)}><X /></button>
              </div>
              <form onSubmit={saveProduct} className="space-y-4">
                <input 
                  className="w-full border p-2 rounded" 
                  placeholder="Name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
                <input 
                  className="w-full border p-2 rounded" 
                  placeholder="Model Number" 
                  value={formData.modelNumber} 
                  onChange={e => setFormData({...formData, modelNumber: e.target.value})} 
                />
                <select 
                  className="w-full border p-2 rounded"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Furniture">Furniture</option>
                  <option value="Light">Light</option>
                  <option value="Kitchenware">Kitchenware</option>
                  <option value="Hardware">Hardware</option>
                </select>
                <div className="flex gap-4">
                   <input 
                    type="number"
                    className="w-1/2 border p-2 rounded" 
                    placeholder="Price" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                  />
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={formData.onSale} 
                      onChange={e => setFormData({...formData, onSale: e.target.checked})} 
                    /> On Sale
                  </label>
                </div>
                {formData.onSale && (
                   <input 
                    type="number"
                    className="w-full border p-2 rounded" 
                    placeholder="Sale Price" 
                    value={formData.salePrice || ''} 
                    onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})} 
                  />
                )}
                <textarea 
                  className="w-full border p-2 rounded" 
                  placeholder="Description" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
                <button type="submit" className="w-full bg-primary text-white py-3 rounded hover:bg-gray-800">Save Product</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
