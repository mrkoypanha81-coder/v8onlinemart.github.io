import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

export const Toast = () => {
  const { toastMessage } = useStore();

  if (!toastMessage) return null;

  const { message, type } = toastMessage;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
  };

  const borderStyles = {
    success: 'border-emerald-500/30 bg-white text-slate-800 shadow-emerald-500/10',
    warning: 'border-amber-500/30 bg-amber-50 text-amber-900 shadow-amber-500/10',
    error: 'border-rose-500/30 bg-rose-50 text-rose-900 shadow-rose-500/10',
    info: 'border-blue-500/30 bg-white text-slate-800 shadow-blue-500/10'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-md">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border shadow-2xl ${borderStyles[type] || borderStyles.info}`}>
        {icons[type] || icons.info}
        <span className="text-xs sm:text-sm font-semibold">{message}</span>
      </div>
    </div>
  );
};
