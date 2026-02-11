import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { useShop } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, Plus, Eye, EyeOff } from 'lucide-react';

const Admin: React.FC = () => {
  const { user, products, deleteProduct, updateProduct } = useShop();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.email.includes('admin')) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  const toggleVisibility = (product: typeof products[0]) => {
    updateProduct({ ...product, isVisible: !product.isVisible });
  };

  if (!user || !user.email.includes('admin')) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Products</h1>
            <p className="text-gray-500">Manage your furniture inventory</p>
          </div>
          <button 
            onClick={() => navigate('/admin/product/new')}
            className="bg-accent text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-orange-600 font-bold shadow-lg shadow-orange-200"
          >
            <Plus size={20} /> Add New Product
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold text-gray-600">ID</th>
                <th className="p-4 font-bold text-gray-600">Image</th>
                <th className="p-4 font-bold text-gray-600">Name / Model</th>
                <th className="p-4 font-bold text-gray-600">Status</th>
                <th className="p-4 font-bold text-gray-600">Price</th>
                <th className="p-4 font-bold text-gray-600">Category</th>
                <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-xs font-mono text-gray-400">{p.id}</td>
                  <td className="p-4">
                    <img src={p.image} className="w-12 h-12 rounded object-cover bg-gray-100" />
                  </td>
                  <td className="p-4">
                     <div className="font-bold text-gray-800">{p.name}</div>
                     <div className="text-xs text-gray-400">{p.modelNumber}</div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleVisibility(p)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${p.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                    >
                      {p.isVisible ? <><Eye size={12} /> Visible</> : <><EyeOff size={12} /> Hidden</>}
                    </button>
                  </td>
                  <td className="p-4">
                    {p.onSale ? (
                      <div>
                        <span className="text-red-600 font-bold">${p.salePrice}</span>
                        <br/>
                        <span className="text-gray-400 text-xs line-through">${p.price}</span>
                      </div>
                    ) : (
                      <span className="font-medium">${p.price}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    <span className="bg-gray-100 rounded-full px-3 py-1 inline-block text-gray-600">{p.category}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/product/${p.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-100 transition-all"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => deleteProduct(p.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;