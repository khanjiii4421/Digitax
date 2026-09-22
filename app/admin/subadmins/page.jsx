"use client";

import { useState, useEffect } from "react";

const ALL_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", icon: "🏠", desc: "View admin dashboard & stats" },
  { key: "ntn_applications", label: "NTN Applications", icon: "📋", desc: "Manage NTN registration applications" },
  { key: "family_tax", label: "Family Tax Filings", icon: "👨‍👩‍👧", desc: "Manage family tax applications" },
  { key: "documents", label: "All Documents", icon: "📁", desc: "View & manage uploaded documents" },
  { key: "leads", label: "Clients & Leads", icon: "👥", desc: "Access leads & client CRM" },
  { key: "coupons", label: "Discount Coupons", icon: "🏷️", desc: "Create & manage discount codes" },
  { key: "payment_methods", label: "Payment Methods", icon: "💳", desc: "Manage payment gateway settings" },
  { key: "faqs", label: "FAQs Management", icon: "❓", desc: "Edit FAQ content" },
  { key: "service_pricing", label: "Service Rates", icon: "💰", desc: "Edit service pricing" },
  { key: "website_control", label: "Website Mode", icon: "🌐", desc: "Toggle maintenance mode" },
  { key: "audit_logs", label: "Audit Logs", icon: "🔍", desc: "View system activity logs" },
  { key: "settings", label: "Content Settings", icon: "⚙️", desc: "Edit homepage & brand content" },
  { key: "queries", label: "Queries & Support", icon: "💬", desc: "View customer support messages" },
];

function PermissionBadge({ label, icon }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
      <span>{icon}</span>{label}
    </span>
  );
}

function SubAdminModal({ subadmin, onClose, onSave }) {
  const [form, setForm] = useState({
    name: subadmin?.name || "",
    email: subadmin?.email || "",
    phone: subadmin?.phone || "",
    password: "",
    permissions: subadmin?.permissions || [],
    is_active: subadmin ? (subadmin.is_active !== false) : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const togglePerm = (key) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key]
    }));
  };

  const selectAll = () => setForm(f => ({ ...f, permissions: ALL_PERMISSIONS.map(p => p.key) }));
  const clearAll = () => setForm(f => ({ ...f, permissions: [] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email) { setError("Name and email are required."); return; }
    if (!subadmin && !form.password) { setError("Password is required for new sub-admin."); return; }
    if (form.password && form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setSaving(true);
    try {
      const method = subadmin ? "PATCH" : "POST";
      const payload = {
        ...(subadmin ? { id: subadmin.id } : {}),
        name: form.name,
        email: form.email,
        phone: form.phone,
        permissions: form.permissions,
        is_active: form.is_active,
        ...(form.password ? { password: form.password } : {}),
      };
      const res = await fetch("/api/admin/subadmins", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        onSave();
      } else {
        setError(data.message || "Failed to save.");
      }
    } catch { setError("Server error. Please try again."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{subadmin ? "Edit Sub-Admin" : "Add New Sub-Admin"}</h3>
              <p className="text-blue-100 text-sm mt-1">{subadmin ? "Update account details & permissions" : "Create a new restricted admin account"}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Ahmad Ali" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="ahmad@digitax.pk" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="+92 300 0000000" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{subadmin ? "New Password (leave blank to keep)" : "Password *"}</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Min. 6 characters" />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="font-semibold text-sm text-gray-800">Account Status</p>
              <p className="text-xs text-gray-500 mt-0.5">Inactive accounts cannot log in</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-sm text-gray-800">Page Access Permissions</p>
                <p className="text-xs text-gray-500 mt-0.5">{form.permissions.length} of {ALL_PERMISSIONS.length} pages selected</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-xs font-bold text-primary hover:underline cursor-pointer">Select All</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={clearAll} className="text-xs font-bold text-red-500 hover:underline cursor-pointer">Clear All</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map(p => (
                <label key={p.key} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.permissions.includes(p.key) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(p.key)}
                    onChange={() => togglePerm(p.key)}
                    className="mt-0.5 w-4 h-4 text-primary rounded cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span>{p.icon}</span>
                      <span className="text-sm font-semibold text-gray-800">{p.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer">
              {saving ? "Saving..." : subadmin ? "Save Changes" : "Create Sub-Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubAdminsPage() {
  const [subadmins, setSubadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSubadmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subadmins");
      const data = await res.json();
      if (data.success) setSubadmins(data.subadmins || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchSubadmins(); }, []);

  const handleSave = () => {
    setShowModal(false);
    setEditing(null);
    fetchSubadmins();
    showToast("Sub-Admin saved successfully!");
  };

  const handleDelete = async (sub) => {
    if (!confirm(`Remove Sub-Admin "${sub.name}"? They will lose all access immediately.`)) return;
    setDeleting(sub.id);
    try {
      const res = await fetch(`/api/admin/subadmins?id=${sub.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchSubadmins();
        showToast("Sub-Admin removed.", "info");
      } else {
        showToast(data.message || "Failed to delete.", "error");
      }
    } catch { showToast("Server error.", "error"); }
    setDeleting(null);
  };

  const handleToggleActive = async (sub) => {
    try {
      const res = await fetch("/api/admin/subadmins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sub.id, is_active: !sub.is_active })
      });
      const data = await res.json();
      if (data.success) {
        fetchSubadmins();
        showToast(`Account ${!sub.is_active ? "activated" : "deactivated"} successfully.`);
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold text-white transition-all ${toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Admin Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">Create & manage restricted admin accounts with granular page permissions</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Sub-Admin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Accounts", value: subadmins.length, color: "bg-blue-50 text-blue-700", icon: "👥" },
          { label: "Super Admins", value: subadmins.filter(s => s.role === 'admin').length, color: "bg-purple-50 text-purple-700", icon: "👑" },
          { label: "Sub-Admins", value: subadmins.filter(s => s.role === 'subadmin').length, color: "bg-amber-50 text-amber-700", icon: "🛡️" },
          { label: "Active Accounts", value: subadmins.filter(s => s.is_active).length, color: "bg-green-50 text-green-700", icon: "✅" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.color} rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs font-semibold opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subadmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <div className="text-5xl mb-3">👤</div>
            <p className="font-semibold text-gray-500">No admin accounts yet</p>
            <p className="text-sm">Create the first sub-admin to delegate access</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Account", "Role", "Permissions", "Status", "Created", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subadmins.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${sub.role === 'admin' ? 'bg-purple-500' : 'bg-primary'}`}>
                          {(sub.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-900">{sub.name}</div>
                          <div className="text-xs text-gray-500">{sub.email}</div>
                          {sub.phone && <div className="text-xs text-gray-400">{sub.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${sub.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                        {sub.role === 'admin' ? '👑 Super Admin' : '🛡️ Sub-Admin'}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      {sub.role === 'admin' ? (
                        <span className="text-xs text-purple-600 font-semibold">All Permissions</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(sub.permissions || []).length === 0 ? (
                            <span className="text-xs text-gray-400">No permissions</span>
                          ) : (sub.permissions || []).slice(0, 3).map(p => {
                            const perm = ALL_PERMISSIONS.find(x => x.key === p);
                            return perm ? <PermissionBadge key={p} label={perm.label} icon={perm.icon} /> : null;
                          })}
                          {(sub.permissions || []).length > 3 && (
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">+{sub.permissions.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => sub.role !== 'admin' && handleToggleActive(sub)}
                        disabled={sub.role === 'admin'}
                        className={`relative w-11 h-6 rounded-full transition-colors ${sub.role === 'admin' ? 'opacity-50 cursor-not-allowed bg-purple-400' : 'cursor-pointer'} ${sub.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sub.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditing(sub); setShowModal(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {sub.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(sub)}
                            disabled={deleting === sub.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-bold text-sm text-blue-800 mb-3">📋 Available Permissions Reference</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {ALL_PERMISSIONS.map(p => (
            <div key={p.key} className="flex items-center gap-2 text-xs text-blue-700">
              <span>{p.icon}</span>
              <span className="font-medium">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <SubAdminModal
          subadmin={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
