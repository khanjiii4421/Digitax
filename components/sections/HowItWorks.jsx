"use client";

import Image from "next/image";

export default function HowItWorks() {
  return (
    <section className="py-12 md:py-16 bg-white overflow-hidden">
      <div className="w-[94%] md:w-[90%] max-w-[1320px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: How DIGITAX Works */}
          <div className="bg-white rounded-3xl p-7 md:p-9 border border-gray-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-10 tracking-tight">
                How <span style={{ color: "#0056A8" }}>DIGITAX</span> Works
              </h2>

              {/* 4 Steps with Connecting Dashed Line */}
              <div className="relative">
                {/* Horizontal Dashed Connector (desktop only) */}
                <div
                  className="hidden sm:block absolute top-7 left-10 right-10 h-0.5 border-t-2 border-dashed z-0"
                  style={{ borderColor: "#b3d0f0" }}
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-3 relative z-10">
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm"
                      style={{ background: "#e8f1fb" }}
                    >
                      <svg className="w-6 h-6" style={{ color: "#0056A8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-1 leading-snug">
                      1. Create Account
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed max-w-[120px]">
                      Sign up and verify your mobile number.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm"
                      style={{ background: "#e8f1fb" }}
                    >
                      <svg className="w-6 h-6" style={{ color: "#0056A8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-1 leading-snug">
                      2. Provide Information
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed max-w-[120px]">
                      Answer simple questions about your income.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm"
                      style={{ background: "#e8f1fb" }}
                    >
                      <svg className="w-6 h-6" style={{ color: "#0056A8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-1 leading-snug">
                      3. Review &amp; File
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed max-w-[120px]">
                      We prepare your return for review and approval.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm"
                      style={{ background: "#e8f1fb" }}
                    >
                      <svg className="w-6 h-6" style={{ color: "#0056A8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-1 leading-snug">
                      4. Process Complete
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed max-w-[120px]">
                      Your tax return is submitted and setup is complete.
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-10">
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #0056A8, #0077cc)" }}
              >
                Get Started Now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>

          {/* Card 2: Why Choose DIGITAX? */}
          <div className="bg-white rounded-3xl p-7 md:p-9 border border-gray-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
                Why Choose <span style={{ color: "#0056A8" }}>DIGITAX</span>?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                
                {/* Left 4 Points */}
                <div className="sm:col-span-7 space-y-5">
                  
                  {/* Item 1 */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                      style={{ background: "#e8f1fb" }}
                    >
                      <svg className="w-5 h-5" style={{ color: "#0056A8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs md:text-sm text-gray-900 leading-snug">
                        FBR-approved &amp; 100% compliant
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                        We follow all FBR rules and regulations.
                      </p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                      style={{ background: "#e8f1fb" }}
                    >
                      <svg className="w-5 h-5" style={{ color: "#0056A8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs md:text-sm text-gray-900 leading-snug">
                        Setup complete, guaranteed
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                        We ensure your tax setup is fully complete and accurate.
                      </p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                      style={{ background: "#e8f1fb" }}
                    >
                      <svg className="w-5 h-5" style={{ color: "#0056A8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs md:text-sm text-gray-900 leading-snug">
                        Secure &amp; private
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                        Your data is encrypted and confidential.
                      </p>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                      style={{ background: "#e8f1fb" }}
                    >
                      <svg className="w-5 h-5" style={{ color: "#0056A8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs md:text-sm text-gray-900 leading-snug">
                        Expert support, always
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                        Chat, call or email — we&apos;re here to help.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Right Consultant Photo */}
                <div className="sm:col-span-5 flex justify-center sm:justify-end">
                  <div className="relative w-44 h-44 sm:w-52 sm:h-52">
                    {/* Blue Circular Backdrop matching Digitax brand */}
                    <div
                      className="absolute inset-0 rounded-full -z-0 transform scale-95"
                      style={{ background: "rgba(0,86,168,0.1)" }}
                    />
                    {/* Consultant Photo */}
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl z-10">
                      <img
                        src="/uploads/digitax-consultant.jpg"
                        alt="DIGITAX Tax Consultant"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    {/* Floating badge */}
                    <div
                      className="absolute -bottom-2 -right-2 z-20 px-3 py-1.5 rounded-full text-white text-[10px] font-black shadow-lg"
                      style={{ background: "#0056A8" }}
                    >
                      Expert ✓
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
