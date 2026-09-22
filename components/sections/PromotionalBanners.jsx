"use client";

import { useEffect, useRef, useState } from "react";

export default function PromotionalBanners() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="w-full py-16 px-4 sm:px-8"
      style={{ background: "linear-gradient(135deg, #f0f7ff 0%, #f8fafc 50%, #f0f4ff 100%)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-3">
            🔥 Exclusive Offers
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Premium Tax & Corporate Services
          </h2>
          <p className="text-gray-500 mt-3 text-base max-w-xl mx-auto">
            Pakistan's most trusted FBR-certified consultants — fast, legal, and hassle-free.
          </p>
        </div>

        {/* Two Half-and-Half Banners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Banner 1: NTN Registration / Active Taxpayer */}
          <div
            className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-700 delay-100 cursor-pointer group ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{
              background: "linear-gradient(135deg, #0056A8 0%, #0077cc 50%, #0099ff 100%)",
              minHeight: "320px"
            }}
          >
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-900/20 rounded-full blur-xl" />
              <div className="absolute top-1/2 right-8 w-24 h-24 border-2 border-white/20 rounded-full" />
              <div className="absolute top-6 right-20 w-12 h-12 border border-white/20 rounded-full" />
            </div>

            <div className="relative z-10 p-7 h-full flex flex-col justify-between">
              <div>
                {/* Badge */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-white text-xs font-bold tracking-wider uppercase">FBR Certified</span>
                  </div>
                  <div className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full">
                    ⚡ 24H Express
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
                  Get Your NTN &<br />
                  <span className="text-yellow-300">Become Active Filer</span>
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-5 max-w-sm">
                  Avoid 100% extra tax withholding on banking, real estate & vehicles. Join 50,000+ active taxpayers filing with DIGITAX.
                </p>

                {/* Benefits */}
                <div className="space-y-2 mb-6">
                  {[
                    "✅ NTN Registration in 24 Hours",
                    "✅ Save up to 50% on Withholding Tax",
                    "✅ FBR Portal Setup & Guidance",
                    "✅ All Categories: Salaried, Business, AOP",
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/90 text-sm font-medium">{b}</div>
                  ))}
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-blue-200 text-xs font-semibold">Starting from</div>
                  <div className="text-white text-3xl font-black">PKR 1,500</div>
                  <div className="text-blue-300 text-xs line-through">PKR 3,000</div>
                </div>
                <a
                  href="/portal/ntn-registration"
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-black px-6 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-black/20 group-hover:shadow-xl group-hover:scale-105 text-sm"
                >
                  Apply in 2 Minutes
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Banner 2: USA LLC & Global Corporate */}
          <div
            className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-700 delay-200 cursor-pointer group ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              minHeight: "320px"
            }}
          >
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-10 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl" />
              {/* Globe decoration */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-36 h-36 border-2 border-white/10 rounded-full hidden sm:block" />
              <div className="absolute right-14 top-1/2 -translate-y-1/2 w-20 h-20 border border-white/10 rounded-full hidden sm:block" />
            </div>

            <div className="relative z-10 p-7 h-full flex flex-col justify-between">
              <div>
                {/* Badges */}
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                    <span className="text-xl">🇺🇸</span>
                    <span className="text-white text-xs font-bold tracking-wider">USA LLC</span>
                  </div>
                  <div className="bg-purple-500/80 text-white text-xs font-black px-3 py-1 rounded-full border border-purple-400/50">
                    🌍 Global Reach
                  </div>
                  <div className="bg-green-500/80 text-white text-xs font-black px-3 py-1 rounded-full border border-green-400/50">
                    🏦 Bank Ready
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
                  USA LLC &
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #a855f7, #3b82f6)" }}> Global Business</span>
                  <br />Registration
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-5 max-w-sm">
                  Sell globally on Amazon, Stripe & Payoneer. Open US bank accounts. Complete legal compliance package for Pakistani freelancers & exporters.
                </p>

                {/* Benefits */}
                <div className="space-y-2 mb-6">
                  {[
                    "🏢 USA LLC/Corp Registration",
                    "💳 Stripe, Paypal & Wise Activation",
                    "📦 Amazon Seller Account Ready",
                    "🏦 US Business Bank Account",
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-300 text-sm font-medium">{b}</div>
                  ))}
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-gray-400 text-xs font-semibold">Package starts at</div>
                  <div className="text-white text-3xl font-black">PKR 25,000</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-500 text-xs line-through">PKR 40,000</span>
                    <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">37% OFF</span>
                  </div>
                </div>
                <a
                  href="/portal"
                  className="flex items-center gap-2 font-black px-6 py-3.5 rounded-2xl transition-all duration-200 shadow-lg group-hover:shadow-xl group-hover:scale-105 text-sm text-gray-900"
                  style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
                >
                  <span className="text-white">Start Global</span>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Bar */}
        <div className={`mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {[
            { icon: "⚡", label: "24-Hour Processing" },
            { icon: "🔒", label: "100% Secure & Legal" },
            { icon: "👨‍💼", label: "FBR Certified Experts" },
            { icon: "💬", label: "24/7 WhatsApp Support" },
            { icon: "✅", label: "50,000+ Happy Clients" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-600 text-sm font-semibold">
              <span className="text-lg">{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
