"use client";

import { useState, useEffect } from "react";

function FileRow({ label, url, filename }) {
  if (!url) return null;

  const handleView = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || label.replace(/\s+/g, "-").toLowerCase();
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-sm font-medium text-text-primary truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleView}
          className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>
  );
}

function ServiceBadge({ type }) {
  const map = {
    ntn: { label: "NTN Registration", color: "bg-blue-100 text-blue-800" },
    "ntn-registration": { label: "NTN Registration", color: "bg-blue-100 text-blue-800" },
    family_tax: { label: "Family Tax Filing", color: "bg-purple-100 text-purple-800" },
    "personal-tax": { label: "Personal Tax Filing", color: "bg-indigo-100 text-indigo-800" },
    "iris-profile": { label: "IRIS Profile Update", color: "bg-teal-100 text-teal-800" },
    "gst-registration": { label: "GST Registration", color: "bg-orange-100 text-orange-800" },
    "business-registration": { label: "Business Registration", color: "bg-amber-100 text-amber-800" },
  };
  const badge = map[type] || { label: type?.replace(/-/g, " ") || "Service", color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
  );
}

export default function CompletedFilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchFiles = async () => {
    try {
      const [ntnRes, familyRes] = await Promise.all([
        fetch("/api/portal/applications").then(r => r.json()).catch(() => ({ success: false })),
        fetch("/api/family-tax/applications").then(r => r.json()).catch(() => ({ success: false }))
      ]);

      let list = [];

      // NTN / service applications
      if (ntnRes.success && Array.isArray(ntnRes.applications)) {
        const ntnApps = ntnRes.applications.filter(a =>
          a.admin_file_url || a.payment_proof_url || a.cnic_front_url
        );
        list = list.concat(ntnApps.map(a => {
          const displayId = Number(a.id) < 2192 ? (2191 + Number(a.id || 1)) : a.id;
          const appFiles = [];
          if (a.admin_file_url) {
            appFiles.push({ label: "NTN Certificate / Completion Document", url: a.admin_file_url, filename: `NTN-Certificate-${displayId}.pdf`, isOfficial: true });
          }
          if (a.cnic_front_url) {
            appFiles.push({ label: "CNIC Front Copy", url: a.cnic_front_url, filename: `CNIC-Front-${displayId}.jpg` });
          }
          if (a.cnic_back_url) {
            appFiles.push({ label: "CNIC Back Copy", url: a.cnic_back_url, filename: `CNIC-Back-${displayId}.jpg` });
          }
          if (a.selfie_url) {
            appFiles.push({ label: "Applicant Photo / Selfie", url: a.selfie_url, filename: `Applicant-Photo-${displayId}.jpg` });
          }
          if (a.payment_proof_url) {
            appFiles.push({ label: "Payment Proof / Receipt", url: a.payment_proof_url, filename: `Payment-Proof-${displayId}.jpg` });
          }

          return {
            id: `ntn-${a.id}`,
            rawId: a.id,
            displayId: `#${displayId}`,
            status: a.status,
            type: a.service_type || "ntn-registration",
            label: `${(a.service_type || "NTN Registration").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} — ${a.category || ""}`.trim().replace(/ —$/, ""),
            date: a.updated_at || a.created_at,
            files: appFiles,
            notes: a.admin_notes
          };
        }));
      }

      // Family / personal tax applications
      if (familyRes.success && Array.isArray(familyRes.data)) {
        const famApps = familyRes.data.filter(a => !a.is_draft);
        list = list.concat(famApps.map(a => {
          const displayId = Number(a.id) < 2192 ? (2191 + Number(a.id || 1)) : a.id;
          const appFiles = [];
          if (a.filed_return_url) {
            appFiles.push({ label: "FBR Filed Tax Return (Official)", url: a.filed_return_url, filename: `Tax-Return-${displayId}.pdf`, isOfficial: true });
          }
          if (a.wealth_statement_url) {
            appFiles.push({ label: "Certified Wealth Statement", url: a.wealth_statement_url, filename: `Wealth-Statement-${displayId}.pdf`, isOfficial: true });
          }
          if (a.payment_proof_url) {
            appFiles.push({ label: "Fee Payment Receipt", url: a.payment_proof_url, filename: `Payment-Receipt-${displayId}.jpg` });
          }

          return {
            id: `family-${a.id}`,
            rawId: a.id,
            displayId: `#${displayId}`,
            orderNumber: a.order_number,
            status: a.status,
            type: "family_tax",
            label: `Family Tax Filing — ${a.full_name || ""}`.trim().replace(/ —$/, ""),
            date: a.updated_at || a.created_at,
            files: appFiles,
            notes: a.admin_notes
          };
        }));
      }

      // Sort by most recent first
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setFiles(list);
    } catch (e) {
      console.error("Error fetching completed files:", e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 anim-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">Completed Files</h1>
        <p className="text-text-secondary mt-1 text-sm">Your processed and completed tax documents — view or download directly.</p>
      </div>

      {files.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[350px]">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">No Completed Files Yet</h3>
          <p className="text-text-secondary max-w-sm text-sm">
            Once your applications are processed and completed by our team, your documents will appear here for direct viewing and download.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {files.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="w-full p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        {item.displayId}
                      </span>
                      <p className="font-bold text-text-primary text-sm truncate">{item.label}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <ServiceBadge type={item.type} />
                      <span className="text-xs text-text-secondary">
                        {new Date(item.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {item.files?.length || 0} Document{(item.files?.length || 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 hidden sm:block">Completed</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded === item.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expanded === item.id && (
                <div className="px-5 md:px-6 pb-6 border-t border-gray-100 pt-5">
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Documents</p>
                  <div className="flex flex-col gap-2">
                    {item.files.map((f, i) => (
                      <FileRow key={i} label={f.label} url={f.url} filename={f.filename} />
                    ))}
                  </div>
                  {item.notes && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
                      <p className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wider">Notes from Digitax Team</p>
                      <p className="text-sm text-blue-900">{item.notes}</p>
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
