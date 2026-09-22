"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ClosedPage() {
  const [data, setData] = useState({
    closed_message: "The DIGITAX portal is currently closed for new filings.",
    maintenance_contact: "info@digitax.pk"
  });

  useEffect(() => {
    fetch("/api/website-mode")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setData(d.data);
          if (d.data.mode === 'ONLINE') {
            window.location.href = '/';
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 md:p-12 font-body relative overflow-hidden">
      {/* Top Brand */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-heading font-extrabold text-2xl tracking-tight text-white">DIGITAX</span>
          <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30 uppercase tracking-widest">
            Closed
          </span>
        </div>
        <Link href="/admin" className="text-xs text-slate-400 hover:text-white font-medium transition-colors">
          Admin Login →
        </Link>
      </div>

      {/* Center Content */}
      <div className="relative z-10 max-w-xl mx-auto text-center my-auto py-12">
        <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-2xl">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight mb-4">
          Submissions Currently Closed
        </h1>

        <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8">
          {data.closed_message || "The DIGITAX portal is currently closed for new filings and applications. If you have an active application, our team is continuing to process it."}
        </p>

        {data.maintenance_contact && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Contact Support: </span>
            {data.maintenance_contact}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} DIGITAX Pakistan. All rights reserved.
      </div>
    </div>
  );
}
