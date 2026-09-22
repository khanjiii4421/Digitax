"use client";

import { useState, useEffect } from "react";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/admin/faqs');
      const data = await res.json();
      if (data.success) setFaqs(data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { fetchFaqs(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
        fetchFaqs();
      } else {
        alert(data.error || 'Failed to save FAQ');
      }
    } catch(e) {
      alert('Error saving FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' });
      fetchFaqs();
    } catch(e) {}
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-20 anim-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-premium shadow-sm p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage client-facing frequently asked questions and answers.</p>
        </div>
        <button
          onClick={() => setEditingItem({ question: '', answer: '', category: 'general', service_key: '', display_order: 0, is_active: 1 })}
          className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm cursor-pointer"
        >
          + Add FAQ
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {faqs.map(faq => (
            <div key={faq.id} className="bg-white rounded-2xl border border-premium p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {faq.category}
                  </span>
                  <h3 className="font-bold text-sm text-gray-900 truncate">{faq.question}</h3>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditingItem(faq)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 anim-fade-in" onClick={() => setEditingItem(null)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingItem.id ? 'Edit FAQ' : 'New FAQ'}</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={editingItem.question}
                  onChange={e => setEditingItem({ ...editingItem, question: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Answer</label>
                <textarea
                  rows={4}
                  required
                  value={editingItem.answer}
                  onChange={e => setEditingItem({ ...editingItem, answer: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="tax, ntn, iris, general"
                    value={editingItem.category || ''}
                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingItem.display_order || 0}
                    onChange={e => setEditingItem({ ...editingItem, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="faq_active"
                  checked={!!editingItem.is_active}
                  onChange={e => setEditingItem({ ...editingItem, is_active: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="faq_active" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Active / Visible
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setEditingItem(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
