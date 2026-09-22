"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PromoPopup({ settings = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract promo settings with robust defaults
  const getSetting = (key, fallback) => {
    const found = settings.find((s) => s.key === key);
    return found ? found.value : fallback;
  };

  const isEnabled = getSetting("promo_popup_enabled", "1") === "1";
  const badge = getSetting("promo_popup_badge", "Limited Time Offer");
  const title = getSetting("promo_popup_title", "Get 30% OFF On Tax Filing Services!");
  const description = getSetting(
    "promo_popup_description",
    "File your tax return or register your NTN with certified professionals. Use our limited-time promotional discount code at checkout!"
  );
  const discountText = getSetting("promo_popup_discount", "30% OFF");
  const couponCode = getSetting("promo_popup_coupon_code", "SAVE30");
  const targetUrl = getSetting("promo_popup_service_url", "/portal/personal-tax");
  const buttonText = getSetting("promo_popup_button_text", "Claim 30% Discount Now");

  useEffect(() => {
    if (!isEnabled) return;

    // Show popup shortly after page load so it pops up reliably on browser refresh
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isEnabled]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !isEnabled) return null;

  // Build target URL with coupon code parameter attached
  const destinationUrl = targetUrl.includes("?")
    ? `${targetUrl}&coupon=${encodeURIComponent(couponCode)}`
    : `${targetUrl}?coupon=${encodeURIComponent(couponCode)}`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade-in" onClick={handleClose}>
      <div
        className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-lg w-full overflow-hidden relative anim-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-primary via-blue-600 to-indigo-700 px-6 py-8 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xl transition-all cursor-pointer leading-none"
            aria-label="Close promotional popup"
          >
            &times;
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-gray-900 shadow-sm mb-3">
            <svg className="w-3.5 h-3.5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {badge}
          </span>

          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            {title}
          </h3>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex flex-col gap-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            {description}
          </p>

          {/* Coupon Display Box */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Promo Coupon Code</span>
              <span className="font-mono font-extrabold text-lg text-primary tracking-widest">{couponCode}</span>
              <span className="text-[11px] text-green-700 font-bold ml-2">({discountText})</span>
            </div>
            <button
              onClick={handleCopy}
              className="bg-white hover:bg-gray-50 text-primary border border-primary/20 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {copied ? "✓ Copied!" : "Copy Code"}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <Link
              href={destinationUrl}
              onClick={handleClose}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3.5 px-6 rounded-2xl text-center shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {buttonText} &rarr;
            </Link>

            <button
              onClick={handleClose}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 text-center py-1 transition-colors cursor-pointer"
            >
              No thanks, I'll pay full price
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
