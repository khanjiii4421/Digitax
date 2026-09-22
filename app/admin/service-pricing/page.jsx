"use client";

import { useState, useEffect } from "react";

export default function AdminServicePricingPage() {
  const [pricingList, setPricingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const fetchPricing = async () => {
    try {
      const res = await fetch('/api/admin/service-pricing');
      const data = await res.json();
      if (data.success) {
        setPricingList(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPricing(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/service-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Pricing updated successfully!');
        setEditingItem(null);
        fetchPricing();
      } else {
        showToast(data.error || 'Failed to save pricing', 'error');
      }
    } catch (e) {
      showToast('Network error saving pricing', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-20 anim-fade-in">
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold flex items-center gap-2 anim-slide-down ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-premium shadow-sm p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Fee & Pricing Management</h1>
          <p className="text-sm text-gray-500 mt-1">Configure live government and DigiTax service rates. All portal forms read from here.</p>
        </div>
        <button
          onClick={() => setEditingItem({
            service_key: '',
            service_name: '',
            government_fee: 0,
            digitax_fee: 0,
            total_fee: 0,
            currency: 'PKR',
            description: '',
            is_active: 1
          })}
          className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
        >
          + Add New Service Rate
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-premium shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Service Key</th>
                  <th className="py-3.5 px-4">Service Name</th>
                  <th className="py-3.5 px-4">Govt Fee</th>
                  <th className="py-3.5 px-4">DigiTax Fee</th>
                  <th className="py-3.5 px-4">Total Fee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pricingList.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary">{item.service_key}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{item.service_name}</td>
                    <td className="py-3.5 px-4 text-gray-600">PKR {parseFloat(item.government_fee).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-gray-600">PKR {parseFloat(item.digitax_fee).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">PKR {parseFloat(item.total_fee).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Edit Rate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 anim-fade-in" onClick={() => setEditingItem(null)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingItem.id ? 'Edit Service Rate' : 'New Service Rate'}
            </h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Service Key (Unique Identifier)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. personal-tax"
                  value={editingItem.service_key}
                  onChange={e => setEditingItem({ ...editingItem, service_key: e.target.value })}
                  disabled={!!editingItem.id}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Service Title / Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Personal Income Tax Filing"
                  value={editingItem.service_name}
                  onChange={e => setEditingItem({ ...editingItem, service_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Govt Fee (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.government_fee}
                    onChange={e => {
                      const gov = parseFloat(e.target.value) || 0;
                      const dtx = parseFloat(editingItem.digitax_fee) || 0;
                      setEditingItem({ ...editingItem, government_fee: gov, total_fee: gov + dtx });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">DigiTax Fee</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.digitax_fee}
                    onChange={e => {
                      const dtx = parseFloat(e.target.value) || 0;
                      const gov = parseFloat(editingItem.government_fee) || 0;
                      setEditingItem({ ...editingItem, digitax_fee: dtx, total_fee: gov + dtx });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Fee</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.total_fee}
                    onChange={e => setEditingItem({ ...editingItem, total_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active_toggle"
                  checked={!!editingItem.is_active}
                  onChange={e => setEditingItem({ ...editingItem, is_active: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="is_active_toggle" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Active (Available for live filing)
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Pricing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
