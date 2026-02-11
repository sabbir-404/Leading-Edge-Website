import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import CategoryGallery from './pages/CategoryGallery';
import SearchResults from './pages/SearchResults';
import CatalogueViewer from './pages/CatalogueViewer';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Shipping from './pages/Shipping';
import Returns from './pages/Returns';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import RequireAuth from './components/RequireAuth';
import { ShopProvider } from './context/ShopContext';

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/gallery/:category" element={<PageTransition><CategoryGallery /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchResults /></PageTransition>} />
        <Route path="/catalogue/:id" element={<PageTransition><CatalogueViewer /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/shipping" element={<PageTransition><Shipping /></PageTransition>} />
        <Route path="/returns" element={<PageTransition><Returns /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route 
          path="/admin" 
          element={
            <PageTransition>
              <RequireAuth adminOnly>
                <Admin />
              </RequireAuth>
            </PageTransition>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <ShopProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </ShopProvider>
  );
};

export default App;