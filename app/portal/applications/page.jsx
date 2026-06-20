"use client";

import { useState, useEffect } from "react";

const STATUS_STEPS = ["pending", "in-review", "in-progress", "completed"];
const STATUS_LABELS = {
  "pending": "Pending",
  "in-review": "In Review",
  "in-progress": "In Progress",
  "completed": "Completed",
  "rejected": "Rejected",
};
const STATUS_COLORS = {
  "pending": "bg-yellow-100 text-yellow-800",
  "in-review": "bg-blue-100 text-blue-800",
  "in-progress": "bg-purple-100 text-purple-800",
  "completed": "bg-green-100 text-green-800",
  "rejected": "bg-red-100 text-red-800",
};
const PAYMENT_COLORS = {
  "pending": "bg-yellow-100 text-yellow-800",
  "verified": "bg-green-100 text-green-800",
  "rejected": "bg-red-100 text-red-800",
};

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const fetchApps = async () => {
    try {
      const res = await fetch("/api/portal/applications");
      const data = await res.json();
      if (data.success) setApplications(data.applications || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchApps(); }, []);

  const handleDownload = (url, filename) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "document";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async (app) => {
    if (navigator.share && app.admin_file_url) {
      try {
        await navigator.share({
          title: "NTN Registration Document",
          text: `NTN Registration - ${app.category} (Application #${app.id})`,
          url: window.location.origin + app.admin_file_url,
        });
      } catch (e) {}
    } else if (app.admin_file_url) {
      navigator.clipboard.writeText(window.location.origin + app.admin_file_url);
      alert("Document link copied to clipboard!");
    }
  };

  const handlePrint = (url) => {
    if (!url) return;
    const win = window.open(url, "_blank");
    if (win) win.addEventListener("load", () => win.print());
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 anim-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">My Applications</h1>
        <p className="text-text-secondary mt-1 text-sm">Track your service requests and download completed documents.</p>
      </div>

      {applications.filter(a => a.status !== "completed").length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="font-bold text-text-primary mb-1">No Applications Yet</h3>
          <p className="text-sm text-text-secondary mb-4">You haven't submitted any service applications yet.</p>
          <a href="/portal/ntn-registration" className="inline-block bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:scale-105 transition-all">
            Apply for NTN Registration
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.filter(a => a.status !== "completed").map((app, idx) => (
            <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header Row */}
              <button
                onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                className="w-full p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary text-sm">#{idx + 1}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-text-primary text-sm">NTN Registration - {app.category}</p>
                    <p className="text-xs text-text-secondary mt-0.5">Submitted: {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[app.status] || app.status}
                  </span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded === app.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>

              {/* Expanded Detail */}
              {expanded === app.id && (
                <div className="px-5 md:px-6 pb-6 border-t border-gray-100 pt-5">
                  {/* Status Timeline */}
                  {app.status !== "rejected" && (
                    <div className="mb-6">
                      <p className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider">Progress</p>
                      <div className="flex items-center">
                        {STATUS_STEPS.map((s, i) => {
                          const isActive = STATUS_STEPS.indexOf(app.status) >= i;
                          return (
                            <div key={s} className="flex items-center flex-1">
                              <div className="flex flex-col items-center flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                                  {isActive ? "✓" : i + 1}
                                </div>
                                <span className="text-[10px] mt-1 text-center">{STATUS_LABELS[s]}</span>
                              </div>
                              {i < STATUS_STEPS.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-0.5 mb-4 ${isActive && STATUS_STEPS.indexOf(app.status) > i ? "bg-green-500" : "bg-gray-200"}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-text-secondary font-medium">Category</p>
                      <p className="text-sm font-bold text-text-primary capitalize">{app.category}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-text-secondary font-medium">Payment</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[app.payment_status] || "bg-gray-100 text-gray-600"}`}>
                          {app.payment_status}
                        </span>
                        <span className="text-xs text-text-secondary">Rs {app.amount} via {app.payment_method}</span>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Documents */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Your Documents</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {app.cnic_front_url && (
                        <div className="flex flex-col">
                          <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <img src={app.cnic_front_url} alt="CNIC Front" className="w-full aspect-[1.586/1] object-cover" />
                            <button onClick={() => setLightbox({url: app.cnic_front_url, title: 'CNIC Front'})} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                              <span className="bg-white text-primary font-bold text-xs px-3 py-1.5 rounded-lg shadow">View</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-center text-text-secondary mt-1 font-medium">CNIC Front</p>
                        </div>
                      )}
                      {app.cnic_back_url && (
                        <div className="flex flex-col">
                          <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <img src={app.cnic_back_url} alt="CNIC Back" className="w-full aspect-[1.586/1] object-cover" />
                            <button onClick={() => setLightbox({url: app.cnic_back_url, title: 'CNIC Back'})} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                              <span className="bg-white text-primary font-bold text-xs px-3 py-1.5 rounded-lg shadow">View</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-center text-text-secondary mt-1 font-medium">CNIC Back</p>
                        </div>
                      )}
                      {app.selfie_url && (
                        <div className="flex flex-col">
                          <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <img src={app.selfie_url} alt="Selfie" className="w-full aspect-square object-cover" />
                            <button onClick={() => setLightbox({url: app.selfie_url, title: 'Selfie'})} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                              <span className="bg-white text-primary font-bold text-xs px-3 py-1.5 rounded-lg shadow">View</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-center text-text-secondary mt-1 font-medium">Selfie</p>
                        </div>
                      )}
                      {app.payment_proof_url && (
                        <div className="flex flex-col">
                          <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <img src={app.payment_proof_url} alt="Payment Proof" className="w-full aspect-square object-cover" />
                            <button onClick={() => setLightbox({url: app.payment_proof_url, title: 'Payment Proof'})} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                              <span className="bg-white text-primary font-bold text-xs px-3 py-1.5 rounded-lg shadow">View</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-center text-text-secondary mt-1 font-medium">Payment Proof</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Completed File */}
                  {app.admin_file_url && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                      <p className="text-xs font-bold text-green-800 mb-3 uppercase tracking-wider">Completed Document</p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleDownload(app.admin_file_url, `NTN-${app.id}`)}
                          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-all cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Download
                        </button>
                        <button
                          onClick={() => handlePrint(app.admin_file_url)}
                          className="flex items-center gap-2 bg-white text-green-700 border border-green-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-50 transition-all cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          Print
                        </button>
                        <button
                          onClick={() => handleShare(app)}
                          className="flex items-center gap-2 bg-white text-green-700 border border-green-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-50 transition-all cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                          Share
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {app.admin_notes && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Admin Notes</p>
                      <p className="text-sm text-text-primary">{app.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4 anim-fade-in" onClick={() => setLightbox(null)}>
          <div className="flex items-center justify-between w-full max-w-4xl mb-3">
            <p className="text-white font-bold text-sm">{lightbox.title}</p>
            <div className="flex gap-3">
              <a href={lightbox.url} target="_blank" rel="noreferrer" className="text-white/80 hover:text-white cursor-pointer" title="Open in new tab">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
              <button onClick={() => setLightbox(null)} className="text-white/80 hover:text-white cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <img src={lightbox.url} alt={lightbox.title} className="max-w-full max-h-[80vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
