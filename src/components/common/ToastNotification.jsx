import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;

  const { type = 'success', title, message, duration = 4000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-slate-900 border-emerald-500/50 text-white',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'warning':
        return {
          bg: 'bg-slate-900 border-amber-500/50 text-white',
          icon: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'error':
        return {
          bg: 'bg-slate-900 border-rose-500/50 text-white',
          icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
      default:
        return {
          bg: 'bg-slate-900 border-blue-500/50 text-white',
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-md w-full px-4">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${style.bg} flex items-start gap-3 relative overflow-hidden`}>
        {style.icon}
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${style.badge}`}>
              LIMS Action Update
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Just Now</span>
          </div>
          {title && <h4 className="font-extrabold text-sm text-white mt-1">{title}</h4>}
          <p className="text-xs text-slate-300 mt-0.5 font-medium leading-relaxed">{message}</p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress bar animation */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-progress"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
