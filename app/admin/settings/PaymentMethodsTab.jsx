"use client";

import { useState, useEffect } from "react";

export default function PaymentMethodsTab() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", account_number: "", account_title: "", is_active: true });
  const [saving, setSaving] = useState(false);

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
    setForm({ name: m.name, account_number: m.account_number, account_title: m.account_title, is_active: !!m.is_active });
    setShowForm(true);
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
      setForm({ name: "", account_number: "", account_title: "", is_active: true });
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

  if (loading) return <div className="text-center py-8 text-sm text-text-secondary">Loading...</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Payment Methods</h3>
          <p className="text-sm text-text-secondary">Manage payment accounts shown to clients during registration.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", account_number: "", account_title: "", is_active: true }); }}
          className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          + Add Method
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <h4 className="font-bold text-sm text-text-primary mb-4">{editId ? "Edit" : "Add"} Payment Method</h4>
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
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {methods.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">No payment methods configured yet.</p>
        ) : methods.map(m => (
          <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                m.name === "Easypaisa" ? "bg-green-500" : m.name === "JazzCash" ? "bg-red-500" : "bg-blue-500"
              }`}>
                {m.name.charAt(0)}
              </div>
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
              <button onClick={() => handleEdit(m)} className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => handleDelete(m.id)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
