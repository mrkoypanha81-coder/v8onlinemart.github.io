import React from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  LayoutGrid, Coffee, Cookie, ShoppingBag, Sparkles
} from 'lucide-react';

const ICON_MAP = {
  LayoutGrid: LayoutGrid,
  Coffee: Coffee,
  Cookie: Cookie,
  ShoppingBag: ShoppingBag,
  Sparkles: Sparkles
};

export const CategoryBar = () => {
  const { lang, selectedCategory, setSelectedCategory, categories, products } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-8 py-2 w-full max-w-full overflow-hidden">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none overscroll-x-contain touch-pan-x">

        {categories.map(cat => {
          const IconComponent = ICON_MAP[cat.icon] || LayoutGrid;
          const isSelected = selectedCategory === cat.id;
          
          // Calculate active items in category
          const count = cat.id === 'all' 
            ? products.length 
            : products.filter(p => p.category_id === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-sm sm:text-base font-bold whitespace-nowrap transition-all flex-shrink-0 shadow-xs ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/25 scale-102 ring-2 ring-emerald-700'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isSelected ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>{lang === 'km' ? cat.name_kh : cat.name_en}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                isSelected ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {count}
              </span>
            </button>

          );
        })}
      </div>
    </div>
  );
};

