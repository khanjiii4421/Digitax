"use client";

import { createContext, useState, useContext, useEffect } from "react";

const ToastContext = createContext({
  showToast: (message, type) => {}
});

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm anim-fade-in pointer-events-auto" onClick={() => setToast(null)}></div>
          
          <div className="relative z-10 bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_30px_100px_rgba(0,0,0,0.2)] rounded-[2rem] p-10 max-w-sm w-full text-center anim-slide-up pointer-events-auto">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg ${toast.type === 'error' ? 'bg-error text-white shadow-error/30' : 'bg-success text-white shadow-success/30'}`}>
              {toast.type === 'error' ? (
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            
            <h3 className="text-2xl font-bold font-heading mb-2 text-text-primary tracking-tight">
              {toast.type === 'error' ? 'Whoops!' : 'Success!'}
            </h3>
            
            <p className="text-text-secondary text-lg mb-8 leading-relaxed">
              {toast.message}
            </p>

            <button 
              onClick={() => setToast(null)}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white hover-scale transition-all ${toast.type === 'error' ? 'bg-error shadow-error/30 hover:shadow-error/50' : 'bg-primary shadow-primary/30 hover:shadow-primary/50'}`}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
