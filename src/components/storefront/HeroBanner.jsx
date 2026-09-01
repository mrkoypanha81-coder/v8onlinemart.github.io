import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';


export const HeroBanner = () => {
  const { lang, t, banners = [], setIsCartOpen, setSelectedCategory } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeBanners = banners.filter(b => b.active);

  // Auto rotate banner every 2 seconds (2000ms)
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeBanners.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const banner = activeBanners[currentSlide] || activeBanners[0];

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentSlide(prev => (prev + 1) % activeBanners.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentSlide(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  // Click on banner opens Cart & Order Drawer immediately as requested
  const handleBannerClick = () => {
    if (banner?.category_id && banner.category_id !== 'all') {
      setSelectedCategory(banner.category_id);
    }
    setIsCartOpen(true);
  };

  if (!banner) return null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-8 pt-2.5 sm:pt-4 pb-1 w-full max-w-full overflow-hidden">
      {/* 1. Pure, Unobstructed Promotional Banner (Clean Full-View Display) */}
      <div 
        onClick={handleBannerClick}
        title={lang === 'km' ? 'ចុចដើម្បីចូលទៅកាន់មុខងារបញ្ជាទិញទំនិញ (Cart)' : 'Click to open Cart & Order'}
        className={`relative rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 w-full max-w-full text-white min-h-[195px] sm:min-h-[250px] flex items-center justify-center cursor-pointer group select-none ${
          banner.image 
            ? 'bg-slate-900' 
            : `bg-gradient-to-r ${banner.gradient || 'from-emerald-900 via-emerald-800 to-orange-700'}`
        } border-2 border-emerald-700/30`}
      >
        {/* If Image exists: Display pure full image without blocking text/elements */}
        {banner.image ? (
          <div className="relative w-full h-full min-h-[195px] sm:min-h-[250px] flex items-center justify-center">
            <img 
              src={banner.image} 
              alt={banner.title_en || 'Promotion Banner'} 
              className="w-full h-full object-cover object-center group-hover:scale-102 transition duration-500 min-h-[195px] sm:min-h-[250px]"
            />
            {/* Subtle bottom tag badge only if badge exists, placed cleanly */}
            {banner.badge_kh && (
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-orange-600/90 backdrop-blur-xs text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                  {lang === 'km' ? banner.badge_kh : (banner.badge_en || banner.badge_kh)}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* If No Image: Show clean styled typography without blocking buttons */
          <div className="relative z-10 w-full px-6 sm:px-12 py-7 sm:py-9 flex flex-col justify-center space-y-3 max-w-2xl text-center items-center">
            {banner.tag_kh && (
              <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black text-amber-300 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{lang === 'km' ? banner.tag_kh : banner.tag_en}</span>
              </div>
            )}

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md">
              {lang === 'km' ? (banner.title_kh || '').replace(/[\uFFFD]+/g, '') : banner.title_en}
            </h2>

            {banner.subtitle_kh && (
              <p className="text-xs sm:text-base text-emerald-100 font-semibold max-w-lg leading-relaxed">
                {lang === 'km' ? (banner.subtitle_kh || '').replace(/[\uFFFD]+/g, '') : banner.subtitle_en}
              </p>
            )}
          </div>
        )}


        {/* Carousel Navigation Arrows if multiple banners */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous Banner"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition opacity-0 group-hover:opacity-100 shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next Banner"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition opacity-0 group-hover:opacity-100 shadow-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Subtle Slider Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(idx);
                  }}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    currentSlide === idx ? 'w-6 bg-orange-400' : 'w-2 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};




