"use client";

import { useState } from "react";

export default function AnnouncementBar({ settings = [] }) {
  const text = settings.find(s => s.key === "announcement_text")?.value || "";
  const link = settings.find(s => s.key === "announcement_link")?.value || "";
  const enabled = settings.find(s => s.key === "announcement_enabled")?.value || "0";
  
  const [dismissed, setDismissed] = useState(false);

  if (enabled !== "1" || !text || dismissed) return null;

  return (
    <div className="sticky top-0 z-[60] bg-primary text-white py-2.5 px-4 text-xs md:text-sm font-medium shadow-sm transition-all duration-300 ease-in-out relative overflow-hidden">
      <div className="flex items-center whitespace-nowrap animate-marquee">
        {link ? (
          <>
            <a href={link} className="hover:underline font-semibold px-8 inline-block">{text}</a>
            <a href={link} className="hover:underline font-semibold px-8 inline-block">{text}</a>
            <a href={link} className="hover:underline font-semibold px-8 inline-block">{text}</a>
            <a href={link} className="hover:underline font-semibold px-8 inline-block">{text}</a>
          </>
        ) : (
          <>
            <span className="px-8 inline-block">{text}</span>
            <span className="px-8 inline-block">{text}</span>
            <span className="px-8 inline-block">{text}</span>
            <span className="px-8 inline-block">{text}</span>
          </>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1 cursor-pointer z-10 bg-primary/80 rounded-full"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
