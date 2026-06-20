"use client";

import { useState, useEffect } from "react";

const STATUS_OPTIONS = ["pending", "in-review", "in-progress", "completed", "rejected"];
const PAYMENT_STATUS_OPTIONS = ["pending", "verified", "rejected"];
const STATUS_LABELS = {
  "pending": "Pending", "in-review": "In Review", "in-progress": "In Progress",
  "completed": "Completed", "rejected": "Rejected",
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

const STATUS_FLOW = ["pending", "in-review", "in-progress", "completed"];

function StatusTimeline({ currentStatus }) {
  if (currentStatus === "rejected") {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        <span className="text-sm font-bold text-red-700">Application Rejected</span>
      </div>
    );
  }
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  return (
    <div className="flex items-center">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= currentIdx;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? "bg-green-500 text-white shadow-sm" : "bg-gray-100 text-gray-400"
              }`}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : i + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium text-center ${done ? "text-green-700" : "text-gray-400"}`}>{STATUS_LABELS[s]}</span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-5 transition-all ${i < currentIdx ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function exportPDF(app) {
  const w = window.open("", "_blank");
  if (!w) return alert("Please allow popups to export PDF.");
  const catLabel = (app.category || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const date = new Date(app.created_at).toLocaleString();
  w.document.write(`<!DOCTYPE html><html><head><title>Application #${app.id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; padding: 30px; color: #1a202c; }
  .header { background: linear-gradient(135deg, #1a5276, #2980b9); color: white; padding: 25px 30px; border-radius: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { font-size: 24px; }
  .header .badge { background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin-bottom: 10px; font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .info-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .info-box .label { font-size: 11px; color: #a0aec0; margin-bottom: 2px; }
  .info-box .value { font-size: 14px; font-weight: bold; }
  .docs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .doc-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .doc-card img { width: 100%; height: 120px; object-fit: cover; }
  .doc-card .doc-label { font-size: 11px; text-align: center; padding: 6px; background: #f7fafc; font-weight: bold; color: #4a5568; }
  .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px; }
  @media print { body { padding: 15px; } .no-print { display: none; } }
</style></head><body>
  <div class="no-print" style="text-align:center;margin-bottom:20px;">
    <button onclick="window.print()" style="background:#1a5276;color:white;border:none;padding:10px 30px;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;">Print / Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <h1>DIGITAX</h1>
      <p style="font-size:13px;opacity:0.8;margin-top:4px;">NTN Registration Application Report</p>
    </div>
    <div class="badge">#${app.id} — ${STATUS_LABELS[app.status] || app.status}</div>
  </div>

  <div class="section">
    <div class="section-title">Customer Information</div>
    <div class="grid">
      <div class="info-box"><div class="label">Full Name</div><div class="value">${app.user_name || "N/A"}</div></div>
      <div class="info-box"><div class="label">Email</div><div class="value">${app.user_email || "N/A"}</div></div>
      <div class="info-box"><div class="label">Phone</div><div class="value">${app.user_phone || "N/A"}</div></div>
      <div class="info-box"><div class="label">CNIC</div><div class="value" style="font-family:monospace;">${app.user_cnic || "N/A"}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Application Details</div>
    <div class="grid-3">
      <div class="info-box"><div class="label">Category</div><div class="value">${catLabel}</div></div>
      <div class="info-box"><div class="label">Payment Method</div><div class="value">${app.payment_method || "N/A"}</div></div>
      <div class="info-box"><div class="label">Amount</div><div class="value">Rs ${app.amount}</div></div>
      <div class="info-box"><div class="label">Payment Status</div><div class="value">${(app.payment_status || "pending").toUpperCase()}</div></div>
      <div class="info-box"><div class="label">Status</div><div class="value">${STATUS_LABELS[app.status] || app.status}</div></div>
      <div class="info-box"><div class="label">Submitted</div><div class="value">${date}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Uploaded Documents</div>
    <div class="docs">
      ${app.cnic_front_url ? `<div class="doc-card"><img src="${window.location.origin}${app.cnic_front_url}" alt="CNIC Front"/><div class="doc-label">CNIC Front</div></div>` : ""}
      ${app.cnic_back_url ? `<div class="doc-card"><img src="${window.location.origin}${app.cnic_back_url}" alt="CNIC Back"/><div class="doc-label">CNIC Back</div></div>` : ""}
      ${app.selfie_url ? `<div class="doc-card"><img src="${window.location.origin}${app.selfie_url}" alt="Selfie"/><div class="doc-label">Selfie</div></div>` : ""}
      ${app.payment_proof_url ? `<div class="doc-card"><img src="${window.location.origin}${app.payment_proof_url}" alt="Payment Proof"/><div class="doc-label">Payment Proof</div></div>` : ""}
    </div>
  </div>

  ${app.admin_file_url ? `<div class="section">
    <div class="section-title">Completed Document</div>
    <div class="info-box"><div class="value"><a href="${window.location.origin}${app.admin_file_url}" target="_blank">${window.location.origin}${app.admin_file_url}</a></div></div>
  </div>` : ""}

  ${app.admin_notes ? `<div class="section">
    <div class="section-title">Admin Notes</div>
    <div class="info-box"><div class="value" style="font-weight:normal;">${app.admin_notes}</div></div>
  </div>` : ""}

  <div class="footer">Generated on ${new Date().toLocaleString()} by DIGITAX Admin Panel</div>
</body></html>`);
  w.document.close();
}

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // Edit state
  const [editStatus, setEditStatus] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const fetchApps = async () => {
    try {
      const res = await fetch("/api/admin/applications");
      const data = await res.json();
      if (data.success) setApplications(data.applications || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchApps(); }, []);

  const openDetail = (app) => {
    setSelected(app);
    setEditStatus(app.status);
    setEditPayment(app.payment_status);
    setEditNotes(app.admin_notes || "");
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status: editStatus,
          payment_status: editPayment,
          admin_notes: editNotes,
        }),
      });
      fetchApps();
      setSelected(null);
    } catch (e) {
      alert("Failed to save.");
    }
    setSaving(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selected) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "applications");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        await fetch("/api/admin/applications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selected.id, admin_file_url: data.url }),
        });
        setSelected({ ...selected, admin_file_url: data.url });
        fetchApps();
      }
    } catch (e) {
      alert("Upload failed.");
    }
    setUploading(false);
  };

  const filtered = applications.filter(app => {
    if (filterStatus !== "all" && app.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        app.user_name?.toLowerCase().includes(q) ||
        app.user_cnic?.includes(q) ||
        app.user_email?.toLowerCase().includes(q) ||
        app.category?.toLowerCase().includes(q) ||
        String(app.id).includes(q)
      );
    }
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 anim-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Applications</h1>
        <p className="text-text-secondary text-sm mt-1">Manage NTN registration and service applications.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, CNIC, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-primary"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-primary cursor-pointer"
        >
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-bold text-text-secondary px-5 py-3">Sr</th>
                <th className="text-left text-xs font-bold text-text-secondary px-5 py-3">Customer</th>
                <th className="text-left text-xs font-bold text-text-secondary px-5 py-3">CNIC</th>
                <th className="text-left text-xs font-bold text-text-secondary px-5 py-3">Category</th>
                <th className="text-left text-xs font-bold text-text-secondary px-5 py-3">Payment</th>
                <th className="text-left text-xs font-bold text-text-secondary px-5 py-3">Status</th>
                <th className="text-left text-xs font-bold text-text-secondary px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-text-secondary">No applications found.</td></tr>
              ) : filtered.map((app, i) => (
                <tr
                  key={app.id}
                  onClick={() => openDetail(app)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 text-sm font-bold text-text-primary">{i + 1}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-text-primary">{app.user_name || "N/A"}</p>
                    <p className="text-xs text-text-secondary">{app.user_email}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-text-secondary font-mono">{app.user_cnic || "N/A"}</td>
                  <td className="px-5 py-3 text-sm text-text-primary capitalize">{app.category}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[app.payment_status] || "bg-gray-100"}`}>
                      {app.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status] || "bg-gray-100"}`}>
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-text-secondary">{new Date(app.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIP Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 anim-fade-in" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-[#1a5276] to-[#2980b9] px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">Application #{selected.id}</h2>
                <p className="text-white/70 text-xs mt-0.5">NTN Registration — {(selected.category || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[editStatus] || "bg-white/20 text-white"}`}>
                  {STATUS_LABELS[editStatus] || editStatus}
                </span>
                <button onClick={() => exportPDF(selected)} className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5" title="Export PDF">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PDF
                </button>
                <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white cursor-pointer">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-6">
              {/* Status Timeline */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Progress
                </p>
                <StatusTimeline currentStatus={editStatus} />
              </div>

              {/* Customer Info */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Customer Information
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">Name</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">{selected.user_name || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">Email</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">{selected.user_email || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">{selected.user_phone || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">CNIC</p>
                    <p className="text-sm font-bold text-text-primary font-mono mt-0.5">{selected.user_cnic || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Uploaded Documents
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selected.cnic_front_url && (
                    <div className="flex flex-col">
                      <div className="relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <img src={selected.cnic_front_url} alt="CNIC Front" className="w-full aspect-[1.586/1] object-cover" />
                        <button onClick={() => setLightbox({url: selected.cnic_front_url, title: 'CNIC Front'})} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                          <span className="bg-white text-primary font-bold text-xs px-3 py-1.5 rounded-lg shadow">View Full</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-center text-text-secondary mt-1.5 font-medium">CNIC Front</p>
                    </div>
                  )}
                  {selected.cnic_back_url && (
                    <div className="flex flex-col">
                      <div className="relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <img src={selected.cnic_back_url} alt="CNIC Back" className="w-full aspect-[1.586/1] object-cover" />
                        <button onClick={() => setLightbox({url: selected.cnic_back_url, title: 'CNIC Back'})} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                          <span className="bg-white text-primary font-bold text-xs px-3 py-1.5 rounded-lg shadow">View Full</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-center text-text-secondary mt-1.5 font-medium">CNIC Back</p>
                    </div>
                  )}
                  {selected.selfie_url && (
                    <div className="flex flex-col">
                      <div className="relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <img src={selected.selfie_url} alt="Selfie" className="w-full aspect-square object-cover" />
                        <button onClick={() => setLightbox({url: selected.selfie_url, title: 'Selfie'})} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                          <span className="bg-white text-primary font-bold text-xs px-3 py-1.5 rounded-lg shadow">View Full</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-center text-text-secondary mt-1.5 font-medium">Selfie</p>
                    </div>
                  )}
                  {selected.payment_proof_url && (
                    <div className="flex flex-col">
                      <div className="relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <img src={selected.payment_proof_url} alt="Payment Proof" className="w-full aspect-square object-cover" />
                        <button onClick={() => setLightbox({url: selected.payment_proof_url, title: 'Payment Proof'})} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                          <span className="bg-white text-primary font-bold text-xs px-3 py-1.5 rounded-lg shadow">View Full</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-center text-text-secondary mt-1.5 font-medium">Payment Proof</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Category */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Payment Details
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">Method</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">{selected.payment_method}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">Amount</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">Rs {selected.amount}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">Payment Status</p>
                    <p className="mt-0.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[editPayment] || "bg-gray-100"}`}>
                        {editPayment}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Controls */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Admin Actions
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">Application Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-primary"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">Payment Status</label>
                    <select
                      value={editPayment}
                      onChange={e => setEditPayment(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-primary"
                    >
                      {PAYMENT_STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-text-primary mb-1">Admin Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-primary resize-none"
                    placeholder="Add notes for the client..."
                  />
                </div>

                {/* Upload Completed File */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-text-primary mb-1">Upload Completed File</label>
                  {selected.admin_file_url && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <a href={selected.admin_file_url} target="_blank" rel="noreferrer" className="text-sm text-green-700 font-medium hover:underline truncate">View uploaded file</a>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-xl py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                    {uploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-text-secondary">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text-sm text-text-secondary font-medium">Choose file (PDF, JPG, etc.)</span>
                      </>
                    )}
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="*/*" />
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-primary text-white font-bold py-3 rounded-xl text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : "Save Changes"}
                  </button>
                  <button
                    onClick={() => exportPDF(selected)}
                    className="bg-gray-100 text-text-primary font-bold py-3 px-5 rounded-xl text-sm hover:bg-gray-200 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    PDF
                  </button>
                </div>
              </div>
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
