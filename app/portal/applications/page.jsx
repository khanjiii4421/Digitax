"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

const STATUS_STEPS = ["pending", "in-review", "in-progress", "completed"];
const STATUS_LABELS = {
  "pending": "Pending",
  "in-review": "In Review",
  "in-progress": "In Progress",
  "completed": "Completed",
  "rejected": "Rejected",
  "Draft": "Draft",
  "Payment Pending": "Payment Pending",
  "Payment Verification": "Payment Verification",
  "Under Review": "Under Review",
  "Processing": "Processing",
  "FBR Submitted": "FBR Submitted",
  "Completed": "Completed"
};
const STATUS_COLORS = {
  "pending": "bg-yellow-100 text-yellow-800",
  "in-review": "bg-blue-100 text-blue-800",
  "in-progress": "bg-purple-100 text-purple-800",
  "completed": "bg-green-100 text-green-800",
  "rejected": "bg-red-100 text-red-800",
  "Payment Pending": "bg-amber-100 text-amber-800",
  "Payment Verification": "bg-orange-100 text-orange-800",
  "Under Review": "bg-blue-100 text-blue-800",
  "Processing": "bg-indigo-100 text-indigo-800",
  "FBR Submitted": "bg-purple-100 text-purple-800",
  "Completed": "bg-green-100 text-green-800",
};
const PAYMENT_COLORS = {
  "pending": "bg-yellow-100 text-yellow-800",
  "verified": "bg-green-100 text-green-800",
  "rejected": "bg-red-100 text-red-800",
  "Pending Payment": "bg-amber-100 text-amber-800",
  "Payment Verification Pending": "bg-orange-100 text-orange-800",
  "Payment Verified": "bg-green-100 text-green-800",
};

export default function MyApplications() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchApps = async () => {
    try {
      const [ntnRes, familyRes] = await Promise.all([
        fetch("/api/portal/applications").then(r => r.json()).catch(() => ({ success: false })),
        fetch("/api/family-tax/applications").then(r => r.json()).catch(() => ({ success: false }))
      ]);

      let list = [];
      if (ntnRes.success && Array.isArray(ntnRes.applications)) {
        list = list.concat(ntnRes.applications.map(item => ({ ...item, appType: item.service_type || 'ntn' })));
      }
      if (familyRes.success && Array.isArray(familyRes.data)) {
        const submittedFamily = familyRes.data.filter(item => !item.is_draft && !item.deleted_at);
        list = list.concat(submittedFamily.map(item => ({ ...item, appType: 'family_tax' })));
      }

      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setApplications(list);
    } catch (e) {
      console.error("Error fetching applications:", e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchApps(); }, []);

  const handleDeleteApp = async (app) => {
    setDeleting(true);
    try {
      const endpoint = app.appType === 'family_tax'
        ? `/api/family-tax/applications?id=${app.id}`
        : `/api/portal/applications?id=${app.id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Application cancelled successfully.", "success");
        setDeleteConfirm(null);
        fetchApps();
      } else {
        showToast(data.error || "Failed to delete application.", "error");
      }
    } catch (e) {
      showToast("Error deleting application. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

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
    const docUrl = app.admin_file_url || app.filed_return_url;
    if (navigator.share && docUrl) {
      try {
        await navigator.share({
          title: app.appType === 'family_tax' ? "Family Tax Filing Document" : "Service Application Document",
          text: `Application #${app.order_number || app.id}`,
          url: window.location.origin + docUrl,
        });
      } catch (e) {}
    } else if (docUrl) {
      navigator.clipboard.writeText(window.location.origin + docUrl);
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

  const getServiceBadge = (type) => {
    if (type === 'family_tax') return { label: 'Family Tax', bg: 'bg-blue-100 text-blue-700' };
    if (type === 'personal-tax') return { label: 'Personal Tax', bg: 'bg-emerald-100 text-emerald-700' };
    if (type === 'iris-profile') return { label: 'IRIS 181', bg: 'bg-indigo-100 text-indigo-700' };
    if (type === 'business-registration') return { label: 'Business Reg', bg: 'bg-amber-100 text-amber-700' };
    if (type === 'gst-registration') return { label: 'GST Reg', bg: 'bg-cyan-100 text-cyan-700' };
    return { label: 'NTN Reg', bg: 'bg-primary/10 text-primary' };
  };

  return (
    <div className="flex flex-col gap-6 anim-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">My Applications</h1>
        <p className="text-text-secondary mt-1 text-sm">Track your service requests, manage filings, and view updates.</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="font-bold text-text-primary mb-1">No Applications Submitted</h3>
          <p className="text-sm text-text-secondary mb-6">You haven't submitted any service applications yet.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/portal/family-tax" className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:scale-105 transition-all shadow-sm">
              Family Tax Filing
            </Link>
            <Link href="/portal/ntn-registration" className="border border-gray-200 text-text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all">
              Apply for NTN
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((app, idx) => {
            const isFamily = app.appType === 'family_tax';
            const uniqueKey = isFamily ? `family_${app.id}` : `ntn_${app.id}`;
            const badge = getServiceBadge(app.appType);
            const title = isFamily
              ? `Family Tax Filing (#${app.order_number})`
              : `${badge.label} — ${app.category || 'Standard'}`;

            return (
              <div key={uniqueKey} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header Row */}
                <div
                  onClick={() => setExpanded(expanded === uniqueKey ? null : uniqueKey)}
                  className="w-full p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${badge.bg}`}>
                      {isFamily ? 'FT' : (app.appType || 'NTN').substring(0, 3).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-text-primary text-sm flex items-center gap-2">
                        {title}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border border-current ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Submitted: {new Date(app.created_at).toLocaleDateString()} &bull; Fee: PKR {(parseFloat(app.amount) || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                    {isFamily && (
                      <Link 
                        href={`/portal/family-tax/${app.id}`} 
                        onClick={e => e.stopPropagation()}
                        className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        View Details
                      </Link>
                    )}
                    {['pending', 'Payment Pending', 'Draft'].includes(app.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(app);
                        }}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Cancel Application"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    {!isFamily && (
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded === uniqueKey ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    )}
                  </div>
                </div>

                {/* Expanded Detail for NTN */}
                {!isFamily && expanded === uniqueKey && (
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
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 anim-fade-in" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Application?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to cancel and delete Application <strong>#{deleteConfirm.id}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all cursor-pointer"
              >
                No, Keep It
              </button>
              <button
                onClick={() => handleDeleteApp(deleteConfirm)}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
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
