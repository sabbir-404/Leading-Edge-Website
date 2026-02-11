import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, Globe, Truck, BookOpen } from 'lucide-react';
import { useShop } from '../context/ShopContext';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useShop();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Fixed Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
           {/* Logo */}
           <img 
               src="/Logo/logo black.png" 
               alt="Leading Edge" 
               className="h-8 w-auto object-contain invert brightness-0 saturate-100 filter" // Invert to white for dark sidebar
           />
        </div>

        <div className="flex-1 py-6 px-3 space-y-1">
           <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Main Menu</p>
           
           <Link to="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/admin') ? 'bg-accent text-white font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <LayoutDashboard size={20} /> Products
           </Link>

           <Link to="/admin/content" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/admin/content') ? 'bg-accent text-white font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Globe size={20} /> Home Page Editor
           </Link>
           
           {/* Catalogue Modification is part of Home/Content usually, but prompt asked for 'another page' or part of sidebar */}
           {/* We can handle catalogues inside AdminContent or a new route. Let's make it distinct in Sidebar but route to same content page with tab or separate page. */}
           {/* Since prompt asked for "Another page to modify catalogues", let's assume it can be a tab in AdminContent or separate. I'll put it in AdminContent as a Tab for UX, or link directly to that tab. */}
           
           <Link to="/admin/shipping" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/admin/shipping') ? 'bg-accent text-white font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Truck size={20} /> Shipping Settings
           </Link>
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <User size={16} />
             </div>
             <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
         {/* Top Admin Navbar (Simplified since sidebar has everything) */}
         <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
             <h2 className="font-bold text-gray-700 capitalize">
                {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
             </h2>
             <div className="flex items-center gap-4">
               <Link to="/" className="text-sm text-gray-500 hover:text-accent flex items-center gap-1">View Store <Globe size={14}/></Link>
             </div>
         </header>

         <main className="p-8">
            {children}
         </main>
      </div>
    </div>
  );
};

export default AdminLayout;