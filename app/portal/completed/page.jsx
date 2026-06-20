"use client";

import { useState, useEffect } from "react";

export default function CompletedFilesPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchApps = async () => {
    try {
      const res = await fetch("/api/portal/applications");
      const data = await res.json();
      if (data.success) setApplications((data.applications || []).filter(a => a.status === "completed"));
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
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">Completed Files</h1>
        <p className="text-text-secondary mt-1 text-sm">Your processed and completed tax documents.</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[350px]">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">No Completed Files</h3>
          <p className="text-text-secondary max-w-sm text-sm">Once your applications are processed and finished, they will appear in this section.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                className="w-full p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-text-primary text-sm">NTN Registration - {app.category}</p>
                    <p className="text-xs text-text-secondary mt-0.5">Completed: {new Date(app.updated_at || app.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800">Completed</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded === app.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>

              {expanded === app.id && (
                <div className="px-5 md:px-6 pb-6 border-t border-gray-100 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-text-secondary font-medium">Application ID</p>
                      <p className="text-sm font-bold text-text-primary">#{app.id}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-text-secondary font-medium">Category</p>
                      <p className="text-sm font-bold text-text-primary capitalize">{app.category}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-text-secondary font-medium">Payment</p>
                      <p className="text-sm font-bold text-text-primary">Rs {app.amount} via {app.payment_method}</p>
                    </div>
                  </div>

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
    </div>
  );
}
