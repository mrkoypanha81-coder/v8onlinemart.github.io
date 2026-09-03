import React from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  ShoppingBag, Heart, AlertTriangle, 
  Flame, Check
} from 'lucide-react';

export const ProductCard = ({ product }) => {
  const { 
    lang, 
    t, 
    formatPrice, 
    formatDualPrice,
    addToCart, 
    setQuickViewProduct, 
    wishlist, 
    toggleWishlist 
  } = useStore();

  const isWishlisted = wishlist.some(item => item.id === product.id);
  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= (product.low_stock_threshold || 5);
  const dual = formatDualPrice(product.price, product.currency);

  return (
    <div 
      onClick={() => setQuickViewProduct(product)}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 shadow-soft hover:shadow-card transition-all duration-200 overflow-hidden flex flex-col relative cursor-pointer active:scale-[0.99]"
    >
      {/* 1. Image Container (Crisp 1:1 Aspect Ratio) */}
      <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.title_en || product.title_kh}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isOutOfStock ? 'grayscale opacity-60' : ''
          }`}
        />



        {/* Top-Right Action Button: Wishlist */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            title="Wishlist"
            className={`p-2 rounded-xl backdrop-blur-md transition shadow-sm ${
              isWishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4 text-center z-20">
            <span className="bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-1">
              {t.outOfStock}
            </span>
            <p className="text-[10px] text-slate-200">Restocking soon</p>
          </div>
        )}

        {/* Low Stock Warning Pill on Image Bottom */}
        {isLowStock && !isOutOfStock && (
          <div className="absolute bottom-2 left-2 right-2 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold py-1 px-2 rounded-lg flex items-center justify-center space-x-1 shadow-sm">
            <AlertTriangle className="w-3 h-3 fill-white text-amber-500" />
            <span>{t.onlyLeft} {product.stock_quantity} {t.itemsLeft}</span>
          </div>
        )}
      </div>

      {/* 2. Product Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Category */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate">
              {lang === 'km' ? product.category_name_kh : product.category_name_en}
            </span>
          </div>

          {/* Product Title (2-Line Clamped) */}
          <h3 
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition leading-snug min-h-[2.5rem]"
            title={lang === 'km' ? product.title_kh : (product.title_en || product.title_kh)}
          >
            {lang === 'km' ? product.title_kh : (product.title_en || product.title_kh)}
          </h3>
        </div>

        {/* 3. Pricing & Quick Add to Cart Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                  {dual.primary}
                </span>
                {product.original_price && (
                  <span className="text-[11px] text-slate-400 line-through">
                    {formatPrice(product.original_price, product.currency)}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold mt-0.5">
                ≈ {dual.secondary}
              </span>
            </div>

            {/* In stock indicator */}
            <div>
              {!isOutOfStock && !isLowStock && (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                  {t.inStock}
                </span>
              )}
            </div>
          </div>

          {/* Quick Add to Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1);
            }}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
              isOutOfStock
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 via-orange-700 to-amber-700 hover:from-orange-700 hover:to-orange-800 active:scale-98 text-white shadow-orange-700/20 hover:shadow-md'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isOutOfStock ? t.outOfStock : (lang === 'km' ? 'ដាក់ក្នុងកន្ត្រក' : 'Add to Cart')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
