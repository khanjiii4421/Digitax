"use client";

import { useState, useEffect, useRef } from "react";

// Known logos for auto-detection
const KNOWN_LOGOS = {
  'easypaisa': '/uploads/payment-logos/easypaisa.svg',
  'easypaisa bank': '/uploads/payment-logos/easypaisa.svg',
  'jazzcash': '/uploads/payment-logos/jazzcash.svg',
  'jazz cash': '/uploads/payment-logos/jazzcash.svg',
  'bank transfer': '/uploads/payment-logos/bank-transfer.svg',
  'bank': '/uploads/payment-logos/bank-transfer.svg',
  'ubl': '/uploads/payment-logos/bank-transfer.svg',
  'hbl': '/uploads/payment-logos/bank-transfer.svg',
  'meezan': '/uploads/payment-logos/bank-transfer.svg',
  'allied bank': '/uploads/payment-logos/bank-transfer.svg',
  'mcbl': '/uploads/payment-logos/bank-transfer.svg',
  'sada pay': '/uploads/payment-logos/easypaisa.svg',
  'nayapay': '/uploads/payment-logos/jazzcash.svg',
};

function detectLogo(name) {
  if (!name) return null;
  return KNOWN_LOGOS[name.toLowerCase().trim()] || null;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", account_number: "", account_title: "", is_active: true, logo_url: "" });
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef(null);

  const fetchMethods = async () => {
    try {
      const res = await fetch("/api/admin/payment-methods");
      const data = await res.json();
      if (data.success) setMethods(data.methods || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchMethods(); }, []);

  const handleEdit = (m) => {
    setEditId(m.id);
    setForm({ name: m.name, account_number: m.account_number, account_title: m.account_title, is_active: !!m.is_active, logo_url: m.logo_url || "" });
    setShowForm(true);
  };

  // Auto-detect logo when name changes
  useEffect(() => {
    if (!form.logo_url && form.name) {
      const auto = detectLogo(form.name);
      // Don't override manual uploads, only set if empty
    }
  }, [form.name]);

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("File too large. Max 2MB.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "payment-logos");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) setForm(prev => ({ ...prev, logo_url: data.url }));
    } catch (err) {
      alert("Logo upload failed.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await fetch("/api/admin/payment-methods", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...form }),
        });
      } else {
        await fetch("/api/admin/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", account_number: "", account_title: "", is_active: true, logo_url: "" });
      fetchMethods();
    } catch (e) {
      alert("Failed to save.");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this payment method?")) return;
    try {
      await fetch("/api/admin/payment-methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchMethods();
    } catch (e) {
      alert("Failed to delete.");
    }
  };

  const handleToggleActive = async (m) => {
    try {
      await fetch("/api/admin/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, is_active: !m.is_active }),
      });
      fetchMethods();
    } catch (e) {}
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 anim-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">Payment Methods</h1>
            <p className="text-text-secondary text-sm mt-1">Manage payment accounts shown to clients during registration.</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", account_number: "", account_title: "", is_active: true, logo_url: "" }); }}
            className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Method
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h4 className="font-bold text-sm text-text-primary mb-4">{editId ? "Edit" : "Add New"} Payment Method</h4>
          <form onSubmit={handleSave}>
            {/* Logo Section */}
            <div className="mb-5 flex items-start gap-5">
              <div className="flex flex-col items-center gap-2">
                <label className="text-xs font-bold text-text-primary">Logo</label>
                {form.logo_url ? (
                  <div className="relative">
                    <img src={form.logo_url} alt="Logo" className="w-28 h-14 object-contain rounded-lg border border-gray-200 bg-white p-1" />
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, logo_url: "" }))} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] cursor-pointer hover:bg-red-600">X</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="w-28 h-14 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[9px] text-gray-400 font-medium">Upload</span>
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleLogoUpload} />
                {form.name && !form.logo_url && detectLogo(form.name) && (
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, logo_url: detectLogo(prev.name) }))} className="text-[10px] text-primary font-medium hover:underline cursor-pointer">
                    Auto-detect logo
                  </button>
                )}
              </div>
              {form.name && !form.logo_url && detectLogo(form.name) && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-4">
                  <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-xs text-green-700 font-medium">Logo auto-detected for &ldquo;{form.name}&rdquo; — click &ldquo;Auto-detect logo&rdquo; to apply</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary ml-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-white text-sm w-full"
                  placeholder="e.g. Easypaisa"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary ml-1">Account Number</label>
                <input
                  type="text"
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-white text-sm w-full"
                  placeholder="e.g. 0300-1234567"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary ml-1">Account Title</label>
                <input
                  type="text"
                  value={form.account_title}
                  onChange={(e) => setForm({ ...form, account_title: e.target.value })}
                  className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-white text-sm w-full"
                  placeholder="e.g. Muhammad Ali"
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-text-primary font-medium">Active (visible to clients)</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-sm">
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="bg-gray-200 text-text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-300 transition-all cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {methods.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <h3 className="font-bold text-text-primary mb-1">No Payment Methods</h3>
            <p className="text-sm text-text-secondary mb-4">Add your first payment method to get started.</p>
            <button
              onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", account_number: "", account_title: "", is_active: true, logo_url: "" }); }}
              className="inline-block bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:scale-105 transition-all cursor-pointer"
            >
              + Add Method
            </button>
          </div>
        ) : methods.map(m => (
          <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {m.logo_url ? (
                <img src={m.logo_url} alt={m.name} className="w-16 h-10 object-contain rounded-lg border border-gray-100 bg-white p-1" />
              ) : (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                  m.name === "Easypaisa" ? "bg-green-500" : m.name === "JazzCash" ? "bg-red-500" : "bg-blue-500"
                }`}>
                  {m.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-text-primary text-sm">{m.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                    {m.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{m.account_title} &bull; {m.account_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleActive(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${m.is_active ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-100 text-green-800 hover:bg-green-200"}`}
              >
                {m.is_active ? "Disable" : "Enable"}
              </button>
              <button onClick={() => handleEdit(m)} className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer" title="Edit">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => handleDelete(m.id)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
