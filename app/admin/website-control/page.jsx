"use client";

import { useState, useEffect } from "react";

export default function AdminWebsiteControlPage() {
  const [data, setData] = useState({
    mode: "ONLINE",
    maintenance_title: "System Maintenance in Progress",
    maintenance_message: "We are currently performing scheduled system upgrades to improve our tax filing services.",
    maintenance_contact: "info@digitax.pk",
    closed_message: "The DIGITAX portal is currently closed for new submissions."
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  useEffect(() => {
    fetch("/api/website-mode")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) setData(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/website-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (resData.success) {
        showToast(`Website status changed to: ${data.mode}`);
      } else {
        showToast(resData.error || "Failed to update", "error");
      }
    } catch(err) {
      showToast("Network error saving website mode", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20 anim-fade-in">
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold flex items-center gap-2 anim-slide-down ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-premium shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Website Availability & Emergency Mode</h1>
        <p className="text-sm text-gray-500 mt-1">Control public access to DigiTax. Admin routes always remain accessible regardless of selected mode.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Mode Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'ONLINE', title: 'Normal Live (ONLINE)', desc: 'Full public access. All tax forms and portals operate normally.', color: 'border-green-500 bg-green-50/40 text-green-700' },
              { id: 'MAINTENANCE', title: 'Maintenance Mode', desc: 'Redirects public visitors to /maintenance page with your message.', color: 'border-amber-500 bg-amber-50/40 text-amber-700' },
              { id: 'CLOSED', title: 'Closed / Suspended', desc: 'Redirects public visitors to /closed page. Submissions paused.', color: 'border-red-500 bg-red-50/40 text-red-700' },
            ].map(m => (
              <div
                key={m.id}
                onClick={() => setData({ ...data, mode: m.id })}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  data.mode === m.id ? m.color + ' ring-2 ring-offset-2' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-gray-900">{m.title}</h3>
                  <div className={`w-3.5 h-3.5 rounded-full ${data.mode === m.id ? 'bg-primary' : 'bg-gray-300'}`} />
                </div>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </div>
            ))}
          </div>

          {/* Config Fields */}
          <div className="bg-white rounded-2xl border border-premium shadow-sm p-6 flex flex-col gap-4">
            <h2 className="font-bold text-base text-gray-900">Custom Status Notices & Contact Info</h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Maintenance Title</label>
              <input
                type="text"
                value={data.maintenance_title || ''}
                onChange={e => setData({ ...data, maintenance_title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Maintenance Message</label>
              <textarea
                rows={3}
                value={data.maintenance_message || ''}
                onChange={e => setData({ ...data, maintenance_message: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Closed / Suspended Message</label>
              <textarea
                rows={3}
                value={data.closed_message || ''}
                onChange={e => setData({ ...data, closed_message: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Emergency Contact Text</label>
              <input
                type="text"
                value={data.maintenance_contact || ''}
                onChange={e => setData({ ...data, maintenance_contact: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="self-end bg-primary hover:bg-primary/90 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Updating Mode...' : 'Save Website Status'}
          </button>
        </form>
      )}
    </div>
  );
}
