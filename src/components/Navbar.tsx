import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ShoppingBag, Menu, X, ChevronRight, LogOut, Trash2, Plus, Minus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { CURRENCY } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { itemCount, user, logout, cart, cartTotal, updateQuantity, removeFromCart, products, categories } = useShop();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof products>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Desktop Menu State
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);

  // Mobile Menu State
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);

  // Cart Toast State
  const [showCartToast, setShowCartToast] = useState(false);
  const prevItemCountRef = useRef(itemCount);

  // Build Dynamic Navigation Structure
  const navItems = categories
    .filter(c => !c.parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(main => ({
      id: main.id,
      label: main.name,
      link: `/gallery/${main.name}`,
      subCategories: categories
        .filter(sub => sub.parentId === main.id)
        .map(sub => ({
          label: sub.name,
          link: `/gallery/${sub.name}` // Direct link to category gallery
        }))
    }));

  useEffect(() => {
    if (itemCount > prevItemCountRef.current) {
      setShowCartToast(true);
      const timer = setTimeout(() => setShowCartToast(false), 3000);
      return () => clearTimeout(timer);
    }
    prevItemCountRef.current = itemCount;
  }, [itemCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
        // Collapse the search bar animation if the user clicks outside and the query is empty
        // or just always collapse on outside click to restore menu visibility
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5); 
      setSearchResults(filtered);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery, products]);

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowSearchDropdown(false);
      navigate(`/search?q=${searchQuery}`);
    }
  };

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const toggleMobileMenu = (id: string) => {
    if (mobileExpandedId === id) {
      setMobileExpandedId(null);
    } else {
      setMobileExpandedId(id);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 h-16 md:h-20 shadow-sm transition-all duration-300">
        <div className={`max-w-7xl mx-auto h-full flex items-center justify-between gap-4 transition-all duration-500 ease-in-out ${isSearchFocused ? 'px-2' : 'px-4'}`}>
          
          <button 
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-primary"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          {/* Desktop Logo */}
          <div className="flex-shrink-0 cursor-pointer hidden md:block transition-transform duration-300" onClick={() => navigate('/')}>
             <img 
               src="/Logo/logo black.png" 
               alt="Leading Edge" 
               className="h-10 w-auto object-contain" 
             />
          </div>
          
          {/* Mobile Logo */}
           <div className="flex-shrink-0 cursor-pointer md:hidden" onClick={() => navigate('/')}>
             <img 
               src="/Logo/logo black.png" 
               alt="Leading Edge" 
               className="h-8 w-auto object-contain" 
             />
          </div>

          {/* Search Bar Container */}
          <div 
            className={`flex-1 relative z-50 flex justify-end md:justify-center transition-all duration-500 ease-in-out ${isSearchFocused ? 'mx-4' : 'mx-2 md:mx-8'}`} 
            ref={searchRef}
          >
            <div className={`relative group transition-all duration-500 ease-in-out ${isSearchFocused ? 'w-full' : 'w-full max-w-[200px] md:max-w-md'}`}>
              <input 
                type="text" 
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Search..." 
                className={`w-full border rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all duration-500 ease-in-out shadow-sm
                  ${isSearchFocused 
                    ? 'bg-white border-accent ring-1 ring-accent/30 shadow-lg' 
                    : 'bg-gray-50 border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent'
                  }`}
              />
              <Search size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isSearchFocused ? 'text-accent' : 'text-gray-400 group-focus-within:text-accent'}`} />
            </div>

            {/* Search Dropdown */}
            <AnimatePresence>
              {showSearchDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden w-full mx-auto z-[60]"
                >
                  {searchResults.length > 0 ? (
                    <ul>
                      {searchResults.map(result => (
                        <li 
                          key={result.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                          onClick={() => {
                            navigate(`/product/${result.id}`);
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            setIsSearchFocused(false);
                          }}
                        >
                          <img src={result.image} alt={result.name} className="w-10 h-10 rounded object-cover" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{result.name}</p>
                            <p className="text-xs text-gray-500">{result.categories[0]}</p>
                          </div>
                        </li>
                      ))}
                      <li 
                        className="px-4 py-2 bg-gray-50 text-center text-xs text-accent font-bold cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          navigate(`/search?q=${searchQuery}`);
                          setShowSearchDropdown(false);
                          setIsSearchFocused(false);
                        }}
                      >
                        View all results for "{searchQuery}"
                      </li>
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No products found.</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Menu - Limited to 6 Items. Fades out on search focus. */}
          <div className={`hidden lg:flex items-center space-x-6 h-full transition-all duration-500 ease-in-out ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden scale-95 translate-x-10' : 'w-auto opacity-100 scale-100 translate-x-0'}`}>
            {navItems.slice(0, 6).map((item) => (
              <div 
                key={item.id} 
                className="relative h-full flex items-center whitespace-nowrap"
                onMouseEnter={() => setHoveredMenuId(item.id)}
                onMouseLeave={() => setHoveredMenuId(null)}
              >
                <Link 
                  to={item.link} 
                  className={`text-sm font-medium transition-colors uppercase tracking-wider flex items-center gap-1 ${hoveredMenuId === item.id ? 'text-accent' : 'text-gray-700 hover:text-accent'}`}
                >
                  {item.label}
                  {item.subCategories.length > 0 && <ChevronDown size={14} />}
                </Link>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {hoveredMenuId === item.id && item.subCategories.length > 0 && !isSearchFocused && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 w-56 bg-white shadow-xl rounded-b-lg border-t-2 border-accent z-50 py-2"
                    >
                      {item.subCategories.map((sub, idx) => (
                        <Link 
                          key={idx}
                          to={sub.link}
                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-accent transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-3 md:space-x-5 text-gray-600 flex-shrink-0 transition-all duration-300">
            <button 
              onClick={handleProfileClick}
              className="hidden md:block hover:text-accent transition-colors"
              title={user ? "Profile" : "Login"}
            >
              <User size={22} strokeWidth={1.5} />
            </button>
            {user && (
              <button 
                onClick={logout} 
                className="hidden md:block hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={20} strokeWidth={1.5} />
              </button>
            )}
            
            {/* Cart Button */}
            <div 
              className="relative"
              onMouseEnter={() => setIsCartHovered(true)}
              onMouseLeave={() => setIsCartHovered(false)}
            >
              <button 
                className="relative hover:text-accent transition-colors py-2"
                onClick={() => navigate('/checkout')}
              >
                <ShoppingBag size={22} strokeWidth={1.5} />
                {itemCount > 0 && (
                  <span className="absolute top-0 -right-1 bg-accent text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Add to Cart Toast */}
              <AnimatePresence>
                {showCartToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 10, x: '-50%' }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap z-[60]"
                  >
                    <Check size={14} className="text-green-400" />
                    Added to Cart!
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isCartHovered && !showCartToast && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-0 w-80 bg-white shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 max-h-[400px] overflow-y-auto">
                      <h3 className="font-bold text-gray-800 mb-3">Shopping Cart</h3>
                      {cart.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">Your cart is empty</p>
                      ) : (
                        <div className="space-y-4">
                          {cart.map(item => (
                            <div key={item.id} className="flex gap-3">
                              <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover bg-gray-50" />
                              <div className="flex-1">
                                <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                                <p className="text-xs text-gray-500 mb-2">{CURRENCY}{item.onSale && item.salePrice ? item.salePrice : item.price}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center border border-gray-200 rounded">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity - 1); }}
                                      className="p-1 hover:bg-gray-100"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span className="text-xs px-2">{item.quantity}</span>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1); }}
                                      className="p-1 hover:bg-gray-100"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {cart.length > 0 && (
                      <div className="bg-gray-50 p-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-medium">Subtotal</span>
                          <span className="font-bold text-primary">{CURRENCY}{cartTotal.toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => navigate('/checkout')}
                          className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          Checkout
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/80 z-50 lg:hidden backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-[#111111] z-50 lg:hidden shadow-2xl overflow-y-auto text-white"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                   <img 
                     src="/Logo/logo black.png" 
                     alt="Leading Edge" 
                     className="h-10 w-auto object-contain invert brightness-0 saturate-100 filter contrast-200" 
                   />
                   <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                     <X size={24} />
                   </button>
                </div>

                <div className="space-y-4">
                  {navItems.map((item) => (
                    <div key={item.id} className="border-b border-gray-800/50 pb-2">
                      <div className="flex items-center justify-between">
                        <Link 
                          to={item.link}
                          onClick={() => setIsMenuOpen(false)}
                          className={`text-lg font-bold tracking-wider uppercase flex-1 py-2 ${mobileExpandedId === item.id ? 'text-accent' : 'text-gray-300'}`}
                        >
                          {item.label}
                        </Link>
                        {item.subCategories.length > 0 && (
                          <button 
                            onClick={(e) => { e.preventDefault(); toggleMobileMenu(item.id); }}
                            className={`p-2 transition-transform ${mobileExpandedId === item.id ? 'text-accent rotate-180' : 'text-gray-500'}`}
                          >
                            <ChevronDown size={20} />
                          </button>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {mobileExpandedId === item.id && item.subCategories.length > 0 && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <ul className="pl-4 py-2 space-y-3 border-l border-gray-800 ml-2">
                              {item.subCategories.map((sub, idx) => (
                                <li key={idx}>
                                  <Link 
                                    to={sub.link}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block text-sm text-gray-400 hover:text-white uppercase tracking-wide"
                                  >
                                    {sub.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  
                  {/* Link to Projects Gallery */}
                  <div className="border-b border-gray-800/50 pb-2">
                      <div className="flex items-center justify-between">
                        <Link 
                          to="/projects"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-lg font-bold tracking-wider uppercase flex-1 py-2 text-gray-300"
                        >
                          Our Projects
                        </Link>
                      </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800">
                   <div className="flex flex-col gap-4">
                      {user ? (
                         <div className="flex items-center gap-3 text-gray-300">
                            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-accent">
                               <User size={20} />
                            </div>
                            <div>
                               <p className="font-bold">{user.name}</p>
                               <button onClick={() => {logout(); setIsMenuOpen(false);}} className="text-xs text-red-500 font-medium uppercase tracking-wider mt-1">Logout</button>
                            </div>
                         </div>
                      ) : (
                         <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => {navigate('/login'); setIsMenuOpen(false);}} className="border border-gray-700 text-white py-3 rounded text-sm font-bold uppercase hover:bg-gray-800 transition-colors">Sign In</button>
                            <button onClick={() => {navigate('/login'); setIsMenuOpen(false);}} className="bg-accent text-white py-3 rounded text-sm font-bold uppercase hover:bg-orange-600 transition-colors">Register</button>
                         </div>
                      )}
                      
                      <Link to="/" className="text-gray-500 text-sm hover:text-white mt-4 block">Contact Us</Link>
                   </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;