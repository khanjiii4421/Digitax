"use client";

import { useState, useEffect } from "react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs?limit=150');
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = logs.filter(l =>
    !filter.trim() ||
    l.action.toLowerCase().includes(filter.toLowerCase()) ||
    (l.admin_name || '').toLowerCase().includes(filter.toLowerCase()) ||
    (l.entity || '').toLowerCase().includes(filter.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-20 anim-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-premium shadow-sm p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Audit Trail & Activity Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Immutable security log of administrative actions, fee modifications, and status changes.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={fetchLogs} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-premium shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-sans">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-gray-900 font-sans">{log.admin_name || `Admin #${log.admin_id}`}</td>
                      <td className="py-3 px-4">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-sans">{log.entity || '—'}</td>
                      <td className="py-3 px-4 text-gray-700 max-w-xs truncate font-sans">{log.details || '—'}</td>
                      <td className="py-3 px-4 text-gray-400">{log.ip_address || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
