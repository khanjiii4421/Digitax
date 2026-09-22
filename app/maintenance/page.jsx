"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function MaintenancePage() {
  const [data, setData] = useState({
    maintenance_title: "System Maintenance in Progress",
    maintenance_message: "We are currently performing scheduled maintenance to upgrade our tax filing platform and security infrastructure.",
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
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 md:p-12 font-body relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-heading font-extrabold text-2xl tracking-tight text-white">DIGITAX</span>
          <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest">
            Maintenance
          </span>
        </div>
        <Link href="/admin" className="text-xs text-slate-400 hover:text-white font-medium transition-colors">
          Admin Login →
        </Link>
      </div>

      {/* Center Content */}
      <div className="relative z-10 max-w-xl mx-auto text-center my-auto py-12">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-2xl">
          <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
        </div>

        <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight mb-4">
          {data.maintenance_title || "System Maintenance"}
        </h1>

        <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8">
          {data.maintenance_message || "We are currently performing routine upgrades to improve your tax filing experience. All submitted applications are completely safe and will resume processing shortly."}
        </p>

        {data.maintenance_contact && (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Urgent Inquiries: </span>
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
