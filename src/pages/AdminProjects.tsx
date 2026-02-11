import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Project } from '../types';
import { Plus, Trash2, Edit, Save, X, Upload } from 'lucide-react';

const AdminProjects: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject } = useShop();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialForm: Project = { id: '', title: '', description: '', coverImage: '', images: [], client: '', date: '' };
  const [formData, setFormData] = useState<Project>(initialForm);

  const handleCreate = () => {
      setFormData({ ...initialForm, id: `proj-${Date.now()}` });
      setEditingId('new');
  };

  const handleEdit = (project: Project) => {
      setFormData(project);
      setEditingId(project.id);
  };

  const handleSave = () => {
      if (editingId === 'new') {
          addProject(formData);
      } else {
          updateProject(formData);
      }
      setEditingId(null);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setFormData(prev => ({ ...prev, coverImage: reader.result as string }));
          reader.readAsDataURL(file);
      }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
          Array.from(files).forEach(file => {
              const reader = new FileReader();
              reader.onloadend = () => setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
              reader.readAsDataURL(file);
          });
      }
  };

  const removeGalleryImage = (idx: number) => {
      setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Projects Management</h1>
            <button onClick={handleCreate} className="bg-accent text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold">
                <Plus size={20} /> Add Project
            </button>
       </div>

       {/* Editor */}
       {editingId && (
           <div className="bg-white p-6 rounded-xl shadow-lg border border-accent relative">
               <button onClick={() => setEditingId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
               <h3 className="text-xl font-bold mb-6">{editingId === 'new' ? 'New Project' : 'Edit Project'}</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-bold mb-1">Project Title</label>
                           <input className="w-full border p-2 rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                       </div>
                       <div>
                           <label className="block text-sm font-bold mb-1">Client Name</label>
                           <input className="w-full border p-2 rounded" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
                       </div>
                       <div>
                           <label className="block text-sm font-bold mb-1">Completion Date</label>
                           <input type="date" className="w-full border p-2 rounded" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                       </div>
                       <div>
                           <label className="block text-sm font-bold mb-1">Description</label>
                           <textarea className="w-full border p-2 rounded h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                       </div>
                   </div>

                   <div className="space-y-6">
                       <div>
                           <label className="block text-sm font-bold mb-2">Cover Image</label>
                           <div className="flex gap-4 items-end">
                               <div className="w-32 h-20 bg-gray-100 rounded overflow-hidden border">
                                   {formData.coverImage && <img src={formData.coverImage} className="w-full h-full object-cover" />}
                               </div>
                               <div className="flex-1">
                                   <input className="w-full text-xs mb-2" type="file" onChange={handleCoverUpload} />
                                   <input className="w-full border p-1 rounded text-xs" placeholder="Or Image URL" value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})} />
                               </div>
                           </div>
                       </div>

                       <div>
                           <label className="block text-sm font-bold mb-2">Gallery Images</label>
                           <div className="grid grid-cols-4 gap-2 mb-2">
                               {formData.images.map((img, idx) => (
                                   <div key={idx} className="relative group aspect-square bg-gray-100 rounded overflow-hidden">
                                       <img src={img} className="w-full h-full object-cover" />
                                       <button onClick={() => removeGalleryImage(idx)} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 size={16} /></button>
                                   </div>
                               ))}
                           </div>
                           <input className="w-full text-xs" type="file" multiple onChange={handleGalleryUpload} />
                       </div>
                   </div>
               </div>

               <div className="flex justify-end">
                   <button onClick={handleSave} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2">
                       <Save size={18} /> Save Project
                   </button>
               </div>
           </div>
       )}

       {/* List */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {projects.map(project => (
               <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                   <div className="aspect-[16/9] bg-gray-100 relative">
                       <img src={project.coverImage} className="w-full h-full object-cover" />
                       <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleEdit(project)} className="bg-white p-2 rounded shadow hover:text-accent"><Edit size={16} /></button>
                           <button onClick={() => deleteProject(project.id)} className="bg-white p-2 rounded shadow hover:text-red-500"><Trash2 size={16} /></button>
                       </div>
                   </div>
                   <div className="p-4">
                       <h3 className="font-bold text-lg mb-1">{project.title}</h3>
                       <p className="text-xs text-gray-500 mb-2">{project.client} | {project.date}</p>
                       <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
};

export default AdminProjects;