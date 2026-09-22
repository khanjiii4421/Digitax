"use client";

import { useState, useEffect } from "react";

const serviceCards = [
  {
    id: "personal-tax",
    title: "Personal Tax Filing",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "from-[#0056A8] to-[#0077cc]",
    bgColor: "bg-blue-50/80",
    link: "/portal/personal-tax",
    available: true
  },
  {
    id: "family-tax",
    title: "Family Tax Filing",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    color: "from-[#0056A8] to-[#1e40af]",
    bgColor: "bg-blue-50/80",
    link: "/portal/family-tax",
    available: true
  },
  {
    id: "ntn-registration",
    title: "NTN Registration",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    color: "from-[#0284c7] to-[#0056A8]",
    bgColor: "bg-sky-50/80",
    link: "/portal/ntn-registration",
    available: true
  },
  {
    id: "iris-profile",
    title: "IRIS Profile Update",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    color: "from-[#0369a1] to-[#0284c7]",
    bgColor: "bg-cyan-50/80",
    link: "/portal/iris-profile",
    available: true
  },
  {
    id: "business-incorporation",
    title: "Business Incorporation",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    color: "from-[#1e3a8a] to-[#0056A8]",
    bgColor: "bg-blue-50/80",
    link: "/portal/business-registration",
    available: true
  },
  {
    id: "gst-registration",
    title: "GST Registration",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
    color: "from-[#0f766e] to-[#0056A8]",
    bgColor: "bg-teal-50/80",
    link: "/portal/gst-registration",
    available: true
  },
  {
    id: "service-charges",
    title: "Service Charges",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    color: "from-[#0056A8] to-[#0284c7]",
    bgColor: "bg-blue-50/80",
    link: "/portal/service-charges",
    available: true
  },
  {
    id: "salary-calculator",
    title: "Salary Tax Calculator",
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    color: "from-[#0056A8] to-[#2563eb]",
    bgColor: "bg-blue-50/80",
    link: "/tools/salary-tax-calculator",
    available: true
  },
  {
    id: "faq",
    title: "FAQ",
    icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "from-[#334155] to-[#475569]",
    bgColor: "bg-slate-50/80",
    link: "/portal/faq",
    available: true
  },
  {
    id: "blog-updates",
    title: "Blog & Updates",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    color: "from-[#0369a1] to-[#0056A8]",
    bgColor: "bg-sky-50/80",
    link: "/portal/blog-updates",
    available: true
  },
  {
    id: "videos",
    title: "Videos",
    icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    color: "from-[#0056A8] to-[#1e3a8a]",
    bgColor: "bg-blue-50/80",
    link: "/portal/videos",
    available: true
  }
];

export default function PortalDashboard() {
  const [showComingSoon, setShowComingSoon] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [checkingResume, setCheckingResume] = useState(true);
  const [dismissResume, setDismissResume] = useState(false);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    fetch("/api/applications/resume")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.hasResumable) {
          setResumeData(data.data.application);
        }
        setCheckingResume(false);
      })
      .catch(() => setCheckingResume(false));

    // Fetch stats
    Promise.all([
      fetch("/api/portal/applications").then(r => r.json()).catch(() => ({ success: false })),
      fetch("/api/family-tax/applications").then(r => r.json()).catch(() => ({ success: false }))
    ]).then(([ntnRes, familyRes]) => {
      let list = [];
      if (ntnRes.success && Array.isArray(ntnRes.applications)) {
        list = list.concat(ntnRes.applications);
      }
      if (familyRes.success && Array.isArray(familyRes.data)) {
        list = list.concat(familyRes.data.filter(item => !item.is_draft));
      }

      let inProg = 0;
      let comp = 0;
      list.forEach(app => {
        if (app.status === 'Completed' || app.status === 'completed') comp++;
        else inProg++;
      });
      setInProgressCount(inProg);
      setCompletedCount(comp);
    });
  }, []);

  const handleResume = () => {
    window.location.href = `/portal/ntn-registration?id=${resumeData.id}&resume=1`;
  };

  const handleStartNew = async () => {
    if (resumeData) {
      await fetch("/api/applications/resume", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resumeData.id }),
      });
    }
    setResumeData(null);
    setDismissResume(true);
    window.location.href = "/portal/ntn-registration";
  };

  const handleDismissResume = async () => {
    if (resumeData) {
      await fetch("/api/applications/resume", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resumeData.id }),
      });
    }
    setResumeData(null);
    setDismissResume(true);
  };

  const handleCardClick = (card) => {
    if (card.available) {
      window.location.href = card.link;
    } else {
      setShowComingSoon(card);
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 anim-fade-in">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">Welcome to your Portal</h1>
          <p className="text-text-secondary mt-1 text-sm md:text-base">Manage your tax filings, registrations, and business services.</p>
        </div>
      </div>

      {/* Resume Prompt */}
      {!checkingResume && resumeData && !dismissResume && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 md:p-6 relative overflow-hidden anim-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">You have an unfinished application</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Started {new Date(resumeData.created_at).toLocaleDateString()} &middot; Status: {resumeData.status}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={handleResume} className="flex-1 sm:flex-none bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-amber-700 transition-all cursor-pointer">
                Resume
              </button>
              <button onClick={handleStartNew} className="flex-1 sm:flex-none border border-amber-300 text-amber-700 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-amber-100 transition-all cursor-pointer">
                Start New
              </button>
              <button onClick={handleDismissResume} className="text-amber-400 hover:text-amber-600 p-2 cursor-pointer" title="Dismiss">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-xs text-text-secondary font-medium">In-Progress</p>
          <p className="text-xl md:text-2xl font-bold text-primary mt-0.5">{inProgressCount}</p>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mb-2">
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-xs text-text-secondary font-medium">Completed</p>
          <p className="text-xl md:text-2xl font-bold text-success mt-0.5">{completedCount}</p>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
            <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </div>
          <p className="text-xs text-text-secondary font-medium">Queries</p>
          <p className="text-xl md:text-2xl font-bold text-warning mt-0.5">0</p>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <p className="text-xs text-text-secondary font-medium">Services</p>
          <p className="text-xl md:text-2xl font-bold text-primary mt-0.5">{serviceCards.length}</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-lg md:text-xl font-bold text-text-primary mb-6">Our Services</h2>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6">
          {serviceCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`flex flex-col items-center text-center gap-3 p-3 md:p-4 rounded-2xl transition-all duration-200 cursor-pointer group relative ${card.available ? "bg-green-50/60 border-2 border-green-400 hover:bg-green-50 hover:shadow-md" : "hover:bg-gray-50"}`}
            >
              {card.available && (
                <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10">
                  Active
                </span>
              )}
              <div className={`w-14 h-14 md:w-16 md:h-16 ${card.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shrink-0 ${card.available ? "ring-2 ring-green-400 ring-offset-2" : ""}`}>
                <svg className="w-7 h-7 md:w-8 md:h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                </svg>
              </div>
              <span className={`text-[11px] md:text-xs font-semibold leading-tight ${card.available ? "text-green-700" : "text-text-primary"}`}>{card.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h3 className="font-bold text-base md:text-lg text-text-primary mb-4">Recent Activity</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 md:gap-4 py-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">Account Created Successfully</p>
              <p className="text-xs text-text-secondary mt-0.5">Welcome to DIGITAX portal.</p>
            </div>
            <span className="text-xs text-text-secondary shrink-0">Just now</span>
          </div>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 anim-fade-in">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative text-center anim-slide-up">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Coming Soon</h3>
            <p className="text-text-secondary text-sm mb-2">
              <strong className="text-text-primary">{showComingSoon.title}</strong>
            </p>
            <p className="text-text-secondary text-sm mb-6">
              This feature is currently under development and will be available soon. Stay tuned!
            </p>
            <button
              onClick={() => setShowComingSoon(null)}
              className="bg-primary text-white font-bold px-8 py-3 rounded-xl text-sm shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer w-full"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
