"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AllDocumentsList() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/family-tax/applications").then(r => r.json()).catch(() => ({ data: [] })),
      fetch("/api/admin/applications").then(r => r.json()).catch(() => ({ data: [] }))
    ]).then(([family, ntn]) => {
      const combined = [
        ...(family.data || family.applications || []).map(a => ({ ...a, _type: 'family-tax' })),
        ...(ntn.data || ntn.applications || []).map(a => ({ ...a, _type: 'ntn' }))
      ];
      // Sort newest first
      combined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setApps(combined);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = apps.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.full_name || a.applicant_name || '').toLowerCase().includes(q) ||
      (a.order_number || a.id || '').toString().includes(q) ||
      (a.cnic || '').toLowerCase().includes(q)
    );
  });

  const getDocCount = (a) => {
    let count = 0;
    if (a.cnic_front_url) count++;
    if (a.cnic_back_url) count++;
    if (a.selfie_url) count++;
    if (a.payment_proof_url) count++;
    if (a.admin_file_url) count++;
    if (a.filed_return_url) count++;
    if (a.wealth_statement_url) count++;
    if (a.documents) count += a.documents.length;
    return count;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Application Documents</h1>
          <p className="text-sm text-gray-500 mt-1">View, download, and print each document separately.</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, order #, CNIC..."
          className="border border-gray-300 rounded-xl px-4 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-text-secondary font-semibold">Loading applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-text-secondary font-semibold">No applications found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 uppercase">Order #</th>
                  <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 uppercase">Applicant</th>
                  <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-center font-bold text-xs text-gray-600 uppercase">Documents</th>
                  <th className="px-4 py-3 text-right font-bold text-xs text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(a => {
                  const docCount = getDocCount(a);
                  return (
                    <tr key={`${a._type}-${a.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">#{a.order_number || a.id}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          a._type === 'ntn' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {a._type === 'ntn' ? 'NTN' : 'Family Tax'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{a.full_name || a.applicant_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          docCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {docCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/documents/${a.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          View Docs
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
