"use client";

export default function TrustBadges() {
  return (
    <div className="w-[94%] md:w-[90%] max-w-[1320px] mx-auto -mt-8 md:-mt-10 mb-12 relative z-20">
      <div className="bg-white rounded-2xl md:rounded-[22px] border border-gray-200/80 shadow-xl shadow-slate-900/5 px-4 py-5 md:py-6 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 gap-y-4 sm:gap-y-0">
          
          {/* 1. Secure & Encrypted */}
          <div className="flex items-center gap-3.5 px-3 md:px-4 py-1.5 first:pl-1">
            <div className="w-11 h-11 rounded-full bg-[#FFF1F2] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#E11D48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs md:text-[13px] text-gray-900 leading-tight">Secure & Encrypted</h4>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">Your data is 100% safe with bank-level security</p>
            </div>
          </div>

          {/* 2. Expert Consultants */}
          <div className="flex items-center gap-3.5 px-3 md:px-4 py-1.5">
            <div className="w-11 h-11 rounded-full bg-[#FFF1F2] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#E11D48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs md:text-[13px] text-gray-900 leading-tight">Expert Consultants</h4>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">Certified professionals at your service</p>
            </div>
          </div>

          {/* 3. Fast Turnaround */}
          <div className="flex items-center gap-3.5 px-3 md:px-4 py-1.5">
            <div className="w-11 h-11 rounded-full bg-[#FFF1F2] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#E11D48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs md:text-[13px] text-gray-900 leading-tight">Fast Turnaround</h4>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">Quick processing & maximum refund</p>
            </div>
          </div>

          {/* 4. FBR Compliant */}
          <div className="flex items-center gap-3.5 px-3 md:px-4 py-1.5">
            <div className="w-12 h-11 flex items-center justify-center shrink-0">
              {/* FBR Emblem SVG */}
              <svg className="w-10 h-8" viewBox="0 0 60 40" fill="none">
                <path d="M5 25C15 10 45 10 55 25" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
                <path d="M8 28C18 16 42 16 52 28" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
                <text x="30" y="27" textAnchor="middle" fill="#0369A1" fontSize="13" fontWeight="900" fontFamily="sans-serif">FBR</text>
                <circle cx="30" cy="11" r="2.5" fill="#EAB308" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs md:text-[13px] text-gray-900 leading-tight">FBR Compliant</h4>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">100% compliant with FBR regulations</p>
            </div>
          </div>

          {/* 5. RAAST Secure Payment */}
          <div className="flex items-center gap-3.5 px-3 md:px-4 py-1.5 last:pr-1">
            <div className="w-12 h-11 flex items-center justify-center shrink-0">
              {/* RAAST SBP Emblem SVG */}
              <div className="w-10 h-9 rounded-lg bg-[#005A36] flex flex-col items-center justify-center p-1 text-white shadow-sm">
                <svg className="w-6 h-5" viewBox="0 0 32 24" fill="none">
                  <path d="M3 18V9L16 3L29 9V18H3Z" stroke="white" strokeWidth="1.75" fill="none" />
                  <rect x="7" y="12" width="3" height="6" fill="white" />
                  <rect x="14.5" y="12" width="3" height="6" fill="white" />
                  <rect x="22" y="12" width="3" height="6" fill="white" />
                  <rect x="2" y="18" width="28" height="2" fill="white" />
                </svg>
                <span className="text-[6px] font-black uppercase tracking-wider text-emerald-200">RAAST</span>
              </div>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs md:text-[13px] text-gray-900 leading-tight">RAAST Secure Payment</h4>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">Fast, safe and reliable payments via RAAST</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
