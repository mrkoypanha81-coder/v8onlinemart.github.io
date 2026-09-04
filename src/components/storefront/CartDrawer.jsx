import React from 'react';
import { useStore } from '../../context/StoreContext';
import { resolveAssetUrl, handleImageError } from '../../utils/resolveAssetUrl';
import { 
  X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, 
  Truck, ShieldCheck, Sparkles 
} from 'lucide-react';

export const CartDrawer = () => {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart,
    cartSubtotal, 
    cartItemCount, 
    shippingFee, 
    cartTotal, 
    isInBoreyTheFlora,
    setIsInBoreyTheFlora,
    formatPrice,
    formatDualPrice,
    lang, 
    t,
    setIsCheckoutOpen 
  } = useStore();

  if (!isCartOpen) return null;

  const freeShippingThreshold = 20;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeShippingPercent = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 transition-colors duration-300">
          {/* 1. Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">{t.yourCart}</h3>
              <span className="bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-900">
                {cartItemCount}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>


          {/* 2. Free Shipping Progress Bar */}
          <div className="p-4 bg-orange-50/70 border-b border-orange-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <div className="flex items-center space-x-1.5 text-orange-800">
                <Truck className="w-4 h-4 text-orange-600" />
                <span>
                  {amountToFreeShipping > 0
                    ? t.freeShippingProgress.replace('{amount}', formatPrice(amountToFreeShipping))
                    : t.freeShippingQualified}
                </span>
              </div>
              <span className="text-[11px] font-mono text-orange-700 font-bold">{Math.round(freeShippingPercent)}%</span>
            </div>
            <div className="w-full h-2 bg-orange-200/70 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${freeShippingPercent}%` }}
              />
            </div>
          </div>

          {/* 3. Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className="font-bold text-slate-800">{t.emptyCart}</h4>
                <p className="text-xs text-slate-500 max-w-xs">{t.emptyCartDesc}</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 py-2 px-5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-orange-600/20"
                >
                  {t.startShopping}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center space-x-3">
                  <img
                    src={resolveAssetUrl(item.product_image)}
                    alt={item.product_title_en}
                    onError={handleImageError}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 line-clamp-1">
                      {lang === 'km' ? item.product_title_kh : item.product_title_en}
                    </h5>
                    <div className="text-[11px] text-slate-400 font-mono mb-1">{item.sku}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-orange-600">
                        {formatPrice(item.unit_price * item.quantity)}
                      </span>
                      
                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                        <button
                          onClick={() => updateCartQuantity(item.product_id, -1)}
                          className="p-1 hover:bg-white text-slate-600 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product_id, 1)}
                          className="p-1 hover:bg-white text-slate-600 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Item */}
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 4. Footer Summary & Checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 space-y-3">
              {/* Borey The Flora Free Delivery Option */}
              <div 
                onClick={() => setIsInBoreyTheFlora(!isInBoreyTheFlora)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isInBoreyTheFlora 
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInBoreyTheFlora}
                    onChange={(e) => setIsInBoreyTheFlora(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">
                        🏡 {lang === 'km' ? 'ខ្ញុំនៅក្នុងបុរី The Flora' : 'In Borey The Flora'}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
                        isInBoreyTheFlora ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isInBoreyTheFlora ? 'Free 0 ៛' : '+6,000 ៛'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {isInBoreyTheFlora 
                        ? (lang === 'km' ? '🎉 ដឹកឥតគិតថ្លៃ (Free 0 ៛) ដល់មុខផ្ទះ' : '🎉 Free delivery inside Borey The Flora')
                        : (lang === 'km' ? '🚚 សេវាដឹក 6,000 ៛ ក្រៅបុរី The Flora' : '🚚 6,000 KHR delivery fee outside')}
                    </p>
                  </div>
                </label>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>{t.subtotal}</span>
                  <span className="font-bold text-slate-800 font-mono">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t.shippingFee}</span>
                  <span className={`font-black font-mono ${isInBoreyTheFlora ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {isInBoreyTheFlora 
                      ? (lang === 'km' ? '0 ៛ (Free 🎉)' : '0 KHR (Free 🎉)') 
                      : formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>{t.total}</span>
                  <div className="text-right">
                    <span className="text-base text-orange-600 block leading-none font-mono">{formatPrice(cartTotal)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">≈ {formatDualPrice(cartTotal).khr}</span>
                  </div>
                </div>
              </div>

              {/* Remarks Box */}
              <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 text-[10px] text-orange-950 flex items-start space-x-1.5">
                <span className="font-black flex-shrink-0">📌 {lang === 'km' ? 'សម្គាល់៖' : 'Note:'}</span>
                <span>
                  {isInBoreyTheFlora
                    ? (lang === 'km' ? 'ដឹកជញ្ជូនឥតគិតថ្លៃ (Free 0 ៛) ក្នុងបុរី The Flora។ តម្លៃទំនិញស្មើនឹងតម្លៃសរុប!' : 'Free delivery inside Borey The Flora. Subtotal equals Total!')
                    : (lang === 'km' ? 'សេវាដឹកជញ្ជូន 6,000 ៛ សម្រាប់ទីតាំងក្រៅបុរី The Flora។' : '6,000 KHR delivery fee applied for outside Borey The Flora.')}
                </span>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-black text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-orange-600/25 transition"
              >
                <span>{t.checkout}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-slate-400 flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Safe & Instant ABA KHQR / Card Checkout</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
