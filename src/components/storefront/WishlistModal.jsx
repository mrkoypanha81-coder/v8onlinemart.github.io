import React from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';

export const WishlistModal = ({ isOpen, onClose }) => {
  const { wishlist, toggleWishlist, addToCart, formatPrice, lang, t } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h3 className="font-bold text-base text-slate-900">{t.wishlist} ({wishlist.length})</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {wishlist.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Heart className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">No favorite products added yet</p>
            </div>
          ) : (
            wishlist.map(product => (
              <div key={product.id} className="pt-3 first:pt-0 flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <img src={product.images[0]} alt={product.title_en} className="w-12 h-12 rounded-xl object-cover border" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{lang === 'km' ? product.title_kh : product.title_en}</p>
                    <span className="text-xs font-bold text-orange-600">{formatPrice(product.price)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      addToCart(product, 1);
                    }}
                    className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl transition"
                    title="Add to Cart"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
