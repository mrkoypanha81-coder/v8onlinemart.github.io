import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  X, Heart, ShoppingBag, Plus, Minus, 
  Check, ShieldCheck, Truck, RotateCcw, AlertTriangle,
  Zap, ArrowRight
} from 'lucide-react';

export const ProductDetailModal = () => {
  const { 
    quickViewProduct, 
    setQuickViewProduct, 
    lang, 
    t, 
    formatPrice, 
    formatDualPrice,
    addToCart, 
    wishlist, 
    toggleWishlist,
    setIsCartOpen,
    setIsCheckoutOpen
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const isWishlisted = wishlist.some(item => item.id === product.id);
  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= (product.low_stock_threshold || 5);
  const dual = formatDualPrice(product.price, product.currency);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    const success = addToCart(product, quantity);
    if (success) {
      setQuickViewProduct(null);
      setIsCheckoutOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative max-h-[92vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Gallery (1:1 Ratio) */}
        <div className="md:w-1/2 p-4 sm:p-6 bg-slate-50 dark:bg-slate-850 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-inner relative">
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.title_en || product.title_kh}
              className="w-full h-full object-cover"
            />
            {product.discount > 0 && (
              <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                -{product.discount}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex items-center space-x-2 mt-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition ${
                    activeImageIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900' : 'border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Purchase */}
        <div className="md:w-1/2 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3.5">
            {/* Category */}
            <div>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block mb-1">
                {lang === 'km' ? product.category_name_kh : product.category_name_en}
              </span>

              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                {lang === 'km' ? product.title_kh : (product.title_en || product.title_kh)}
              </h2>
            </div>

            {/* Price Box */}
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {dual.primary}
                  </span>
                  {product.original_price && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatPrice(product.original_price, product.currency)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">≈ {dual.secondary}</span>
              </div>

              {/* Stock Status Badge */}
              <div>
                {isOutOfStock ? (
                  <span className="text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                    {t.outOfStock}
                  </span>
                ) : isLowStock ? (
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>{t.onlyLeft} {product.stock_quantity} left</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {t.inStock}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {(product.description_kh || product.description_en) && (
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-750">
                <p>{lang === 'km' ? (product.description_kh || product.description_en) : (product.description_en || product.description_kh)}</p>
              </div>
            )}

            {/* Delivery Assurance */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
              <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                <Truck className="w-3.5 h-3.5 text-orange-500" />
                <span>{lang === 'km' ? 'ដឹកជញ្ជូនរហ័ស ៣០ នាទី' : '30-Min Express'}</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'km' ? 'ធានាទំនិញសុទ្ធ ១០០%' : '100% Guaranteed'}</span>
              </div>
            </div>
          </div>

          {/* Quantity and Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {!isOutOfStock && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'km' ? 'ចំនួនទិញ (Quantity):' : 'Quantity:'}
                </span>
                <div className="flex items-center space-x-2 border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-slate-50 dark:bg-slate-800">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-slate-100">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons: Wishlist + Add to Cart + Buy Now */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-2xl border transition ${
                  isWishlisted 
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-98 text-white text-xs font-bold flex items-center justify-center space-x-1.5 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 transition shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{lang === 'km' ? 'ដាក់ក្នុងកន្ត្រក' : 'Add to Cart'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-98 text-white text-xs font-black flex items-center justify-center space-x-1.5 disabled:opacity-40 shadow-md shadow-orange-600/25 transition"
              >
                <Zap className="w-4 h-4" />
                <span>{lang === 'km' ? 'បញ្ជាទិញភ្លាមៗ' : 'Buy Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
