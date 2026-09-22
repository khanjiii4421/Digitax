"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ICONS = [
  <path key="0" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-2M5 21h2m-2 0H3m2 0h2m10-16v4m-4-4v4M9 5v4" />,
  <path key="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-7-7 7M3 3h18" />,
  <path key="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />,
  <path key="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
  <path key="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
];

export default function PopularProducts({ products, user = null }) {
  const displayProducts =
    products && products.length > 0
      ? products
      : [
          { id: 1, title: "Company Registration", description: "Register your Private Limited Company in Pakistan quickly and easily.", button_text: "Start Now" },
          { id: 2, title: "NTN Registration", description: "Get your National Tax Number online without visiting the FBR office.", button_text: "Start Now" },
          { id: 3, title: "Sales Tax Registration", description: "Register for GST/PST and start filing your monthly sales tax returns.", button_text: "Start Now" },
          { id: 4, title: "Trademark Registration", description: "Protect your brand identity and logo from copycats.", button_text: "Start Now" },
          { id: 5, title: "USA LLC Formation", description: "Setup your LLC in the USA and open international payment gateways.", button_text: "Start Now" },
        ];

  const [visibleCount, setVisibleCount] = useState(3);
  const total = displayProducts.length;
  const maxIndex = Math.max(0, total - visibleCount);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setVisibleCount(1);
      } else if (window.innerWidth <= 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (activeIndex > maxIndex) {
      setActiveIndex(maxIndex);
    }
  }, [maxIndex, activeIndex]);

  const goTo = useCallback(
    (idx) => {
      setActiveIndex(Math.min(Math.max(idx, 0), maxIndex));
    },
    [maxIndex]
  );

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  }, [next]);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  const handleNav = (fn) => {
    fn();
    resetTimer();
  };

  const gapPx = 24;
  const cardWidthPct = 100 / visibleCount;
  const offsetX = `calc(${activeIndex} * -1 * (100% + ${gapPx}px) / ${visibleCount})`;

  return (
    <section id="services" className="py-24 bg-background-light">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pp-track {
            display: flex;
            gap: ${gapPx}px;
            transition: transform 0.55s cubic-bezier(.4,0,.2,1);
          }
          .pp-card {
            flex: 0 0 calc(${cardWidthPct}% - ${(gapPx * (visibleCount - 1)) / visibleCount}px);
            min-width: 0;
          }
        `,
        }}
      />

      <div className="mx-auto max-w-[1400px] w-[90%]">
        <div className="flex flex-col items-center text-center mb-16 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Popular Business Services
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Everything you need to start and grow your business.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleNav(prev)}
              aria-label="Previous"
              className="w-12 h-12 rounded-full border border-premium bg-white shadow-sm flex items-center justify-center hover:border-primary hover:text-primary transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => handleNav(next)}
              aria-label="Next"
              className="w-12 h-12 rounded-full bg-primary text-white shadow-sm flex items-center justify-center hover:bg-primary/90 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="pp-track"
            style={{ transform: `translateX(${offsetX})` }}
          >
            {displayProducts.map((product, idx) => (
              <div
                key={product.id}
                className="pp-card bg-white rounded-[20px] p-8 border border-premium shadow-premium flex flex-col gap-4 group hover:bg-primary hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-primary/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center text-primary group-hover:text-white transition-colors">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {ICONS[idx % ICONS.length]}
                  </svg>
                </div>
                <h3 className="text-xl font-bold group-hover:text-white transition-colors">
                  {product.title}
                </h3>
                <p className="text-text-secondary text-sm group-hover:text-white/80 transition-colors flex-1">
                  {product.description}
                </p>
                <button
                  className="mt-2 py-3 px-6 rounded-full border-2 border-primary text-primary font-semibold group-hover:bg-white group-hover:border-white group-hover:text-primary transition-all duration-200 text-center w-full cursor-pointer"
                  onClick={() => {
                    const target = product.button_link || "/portal";
                    if (target.startsWith("http")) {
                      window.location.href = target;
                    } else if (user) {
                      window.location.href = target;
                    } else {
                      window.location.href = `/login?redirect=${encodeURIComponent(target)}`;
                    }
                  }}
                >
                  {product.button_text || "Start Now"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleNav(() => goTo(idx))}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === idx ? "w-8 bg-primary" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
