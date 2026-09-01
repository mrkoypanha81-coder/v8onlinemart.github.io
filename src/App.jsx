import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/common/Header';
import { Toast } from './components/common/Toast';
import { SideDrawer } from './components/common/SideDrawer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { WishlistModal } from './components/storefront/WishlistModal';
import { StorefrontView } from './components/storefront/StorefrontView';
import { AdminLayout } from './components/admin/AdminLayout';

const MainContent = () => {
  const { viewMode } = useStore();
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    const handleOpenWishlist = () => setIsWishlistOpen(true);
    window.addEventListener('open-wishlist', handleOpenWishlist);
    return () => window.removeEventListener('open-wishlist', handleOpenWishlist);
  }, []);

  // 1. Admin Portal Layout (Dedicated Management View)
  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 font-sans w-full max-w-full overflow-x-hidden">
        <AdminLayout />
        <Toast />
      </div>
    );
  }

  // 2. Customer Storefront Layout (Dedicated Shopper View)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-16 md:pb-0 w-full max-w-full overflow-x-hidden transition-colors duration-300">
      <Header />
      
      {/* Left Slide-out Navigation Drawer */}
      <SideDrawer />

      <main className="flex-1 w-full max-w-full overflow-x-hidden content-scalable">
        <StorefrontView />
      </main>
      
      {/* Customer Mobile Navigation Bar */}
      <MobileBottomNav 
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />

      {/* Customer Modals */}
      <WishlistModal 
        isOpen={isWishlistOpen} 
        onClose={() => setIsWishlistOpen(false)} 
      />
      <Toast />
    </div>
  );
};


export function App() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}

export default App;

