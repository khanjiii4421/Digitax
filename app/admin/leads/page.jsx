"use client";

import { useState, useEffect } from "react";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  "in-review": "bg-blue-100 text-blue-800",
  "in-progress": "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function EmailModal({ client, onClose }) {
  const [form, setForm] = useState({
    subject: `Exclusive Offer for ${client.name || "You"} — File Your Taxes Today!`,
    message: `We noticed you haven't completed your tax registration yet. Our team at DIGITAX is ready to assist you!\n\nComplete your NTN Registration in just 2 minutes and enjoy our express processing service.\n\nDon't miss the tax filing deadline — contact us now!`,
    discount: "15%",
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: client.email || client.user_email,
          name: client.name || client.user_name,
          subject: form.subject,
          message: form.message,
          discount: form.discount || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        setTimeout(onClose, 2000);
      } else {
        setError(data.message || "Failed to send.");
      }
    } catch { setError("Server error."); }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Send Promotional Email</h3>
              <p className="text-green-100 text-sm">To: {client.name || client.user_name} ({client.email || client.user_email})</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-bold text-green-700">Email Sent Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-5 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject Line</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-500" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount / Offer (optional)</label>
              <input value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-500" placeholder="e.g. 20% OFF" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Body</label>
              <textarea rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-500 resize-none" required />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={sending} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 disabled:opacity-60 cursor-pointer">
                {sending ? "Sending..." : "📧 Send Email"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [data, setData] = useState({ users: [], draftLeads: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("clients"); // 'clients' | 'leads'
  const [emailTarget, setEmailTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async (s = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leads?search=${encodeURIComponent(s)}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(search);
  };

  const openWhatsApp = (phone, name) => {
    const cleaned = (phone || "").replace(/[^0-9]/g, "");
    const intlPhone = cleaned.startsWith("0") ? "92" + cleaned.slice(1) : cleaned;
    const msg = encodeURIComponent(`السلام علیکم ${name || ""}! DIGITAX کی طرف سے آپ کو خصوصی پیشکش: NTN رجسٹریشن اور ٹیکس فائلنگ کے لیے آج ہی رابطہ کریں۔ https://digitax.pk`);
    window.open(`https://wa.me/${intlPhone}?text=${msg}`, "_blank");
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const stats = data.stats || {};

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold text-white bg-green-600">{toast}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients & Leads CRM</h1>
          <p className="text-gray-500 text-sm mt-1">Track all registered clients and follow up on incomplete applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: stats.totalUsers || 0, color: "bg-blue-50 text-blue-700", icon: "👥" },
          { label: "All Applications", value: stats.totalApplications || 0, color: "bg-purple-50 text-purple-700", icon: "📋" },
          { label: "Pending Follow-up", value: stats.pendingCount || 0, color: "bg-amber-50 text-amber-700", icon: "⏳" },
          { label: "Completed Cases", value: stats.completedCount || 0, color: "bg-green-50 text-green-700", icon: "✅" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.color} rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs font-semibold opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setActiveTab("clients")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "clients" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              👥 All Clients ({data.users.length})
            </button>
            <button onClick={() => setActiveTab("leads")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "leads" ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              ⏳ Pending Leads ({data.draftLeads.length})
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone..."
              className="flex-1 sm:w-60 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 cursor-pointer">Search</button>
            {search && <button type="button" onClick={() => { setSearch(""); fetchData(""); }} className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl text-sm cursor-pointer">✕</button>}
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === "clients" ? (
          <div className="overflow-x-auto">
            {data.users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <div className="text-5xl mb-3">👤</div>
                <p className="font-semibold">No clients found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Client", "Contact", "Applications", "Last Activity", "Status", "Actions"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center text-sm">
                            {(u.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{u.name || "—"}</div>
                            <div className="text-xs text-gray-400">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-700">{u.email}</div>
                        {u.phone && (
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{u.phone}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2 text-xs">
                          {u.ntn_count > 0 && <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">NTN: {u.ntn_count}</span>}
                          {u.family_count > 0 && <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Family: {u.family_count}</span>}
                          {!u.ntn_count && !u.family_count && <span className="text-gray-400">No apps</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {formatDate(u.last_ntn_date || u.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        {u.last_status ? (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[u.last_status] || "bg-gray-100 text-gray-600"}`}>
                            {u.last_status.replace(/-/g, " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No app</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {u.phone && (
                            <button
                              onClick={() => openWhatsApp(u.phone, u.name)}
                              className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="WhatsApp"
                            >
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              WA
                            </button>
                          )}
                          {u.phone && (
                            <a
                              href={`tel:${u.phone}`}
                              className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              title="Call"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              Call
                            </a>
                          )}
                          {u.email && (
                            <button
                              onClick={() => setEmailTarget(u)}
                              className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Send Email"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              Email
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Draft Leads Tab */
          <div className="overflow-x-auto">
            {data.draftLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <div className="text-5xl mb-3">🎉</div>
                <p className="font-semibold">No pending follow-ups!</p>
                <p className="text-sm">All applications are being actively processed</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-700 font-medium">
                  ⏳ {data.draftLeads.length} applications have been stuck in "Pending" for 2+ days — consider following up
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["Client", "Service", "Submitted", "Days Waiting", "Actions"].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.draftLeads.map(lead => {
                      const daysWaiting = Math.floor((new Date() - new Date(lead.created_at)) / (1000 * 60 * 60 * 24));
                      const catLabel = (lead.category || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "NTN Registration";
                      return (
                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-sm text-gray-900">{lead.user_name || "Unknown"}</div>
                            <div className="text-xs text-gray-500">{lead.user_email}</div>
                            {lead.user_phone && <div className="text-xs text-gray-400 font-mono">{lead.user_phone}</div>}
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-medium text-gray-700">{catLabel}</span>
                            <div className="text-xs text-gray-400 mt-0.5">App #{lead.id}</div>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500">{formatDate(lead.created_at)}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${daysWaiting >= 7 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                              {daysWaiting} day{daysWaiting !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              {lead.user_phone && (
                                <button
                                  onClick={() => openWhatsApp(lead.user_phone, lead.user_name)}
                                  className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                  WhatsApp
                                </button>
                              )}
                              {lead.user_phone && (
                                <a href={`tel:${lead.user_phone}`} className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                  Call
                                </a>
                              )}
                              {lead.user_email && (
                                <button
                                  onClick={() => setEmailTarget({ name: lead.user_name, email: lead.user_email })}
                                  className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                  Email
                                </button>
                              )}
                              <a href={`/admin/applications`} className="flex items-center gap-1 bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                View
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>

      {/* Email Modal */}
      {emailTarget && (
        <EmailModal client={emailTarget} onClose={() => setEmailTarget(null)} />
      )}
    </div>
  );
}
