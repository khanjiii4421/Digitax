"use client";

import { useState, useEffect } from "react";

const STEPS = ["Category", "CNIC Upload", "Selfie", "Payment", "Confirmation"];
const CATEGORIES = {
  "individual": "Individual",
  "aop": "AOP",
  "partnership": "Partnership Firm",
  "private-limited": "Private Limited",
  "sole-proprietor": "Sole Proprietor",
};

export default function ResumeFilesPage() {
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    // Check localStorage for ntn_draft_* keys
    const found = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("ntn_draft_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          found.push({ key, ...data });
        } catch(e) {}
      }
    }
    setDrafts(found);
  }, []);

  const removeDraft = (key) => {
    localStorage.removeItem(key);
    setDrafts(prev => prev.filter(d => d.key !== key));
  };

  return (
    <div className="flex flex-col gap-6 anim-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">Resume Files</h1>
        <p className="text-text-secondary mt-1 text-sm">Pick up where you left off with your filings.</p>
      </div>

      {drafts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[350px]">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">No In-Progress Filings</h3>
          <p className="text-text-secondary max-w-sm text-sm">All your active/in-progress applications will show up here. Start a service to begin.</p>
          <button 
            onClick={() => window.location.href = '/portal/services'}
            className="mt-6 bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Browse Services
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {drafts.map((draft, idx) => (
            <div key={draft.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-sm">NTN Registration - {CATEGORIES[draft.category] || draft.category || "Not selected"}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Last step: <span className="font-medium">{STEPS[draft.step] || "Category"}</span>
                      {draft.savedAt && ` • Saved ${new Date(draft.savedAt).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => removeDraft(draft.key)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all cursor-pointer"
                  >
                    Discard
                  </button>
                  <a
                    href="/portal/ntn-registration"
                    className="text-xs font-bold text-white bg-primary px-4 py-1.5 rounded-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    Resume
                  </a>
                </div>
              </div>

              {/* Mini progress */}
              <div className="mt-4 flex items-center gap-1">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`h-1.5 flex-1 rounded-full ${i <= draft.step ? "bg-primary" : "bg-gray-200"}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
