"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function QueriesTab() {
  const { showToast } = useToast();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchQueries = async () => {
    try {
      const res = await fetch("/api/admin/queries");
      if (res.ok) {
        const data = await res.json();
        setQueries(data);
      }
    } catch {
      showToast("Failed to load queries.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "unread" ? "read" : "unread";
    try {
      const res = await fetch("/api/admin/queries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        showToast(`Query marked as ${nextStatus}!`, "success");
        fetchQueries();
      }
    } catch {
      showToast("Failed to update status.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this query?")) return;
    try {
      const res = await fetch("/api/admin/queries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast("Query deleted successfully.", "success");
        fetchQueries();
      } else {
        showToast("Failed to delete query.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const filteredQueries = queries.filter((q) => {
    const matchesSearch =
      q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.phone.includes(searchTerm) ||
      (q.subject && q.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      q.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || q.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-8 anim-fade-in max-w-5xl">
      <div>
        <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Client Inquiries & Leads</h2>
        <p className="text-text-secondary text-sm mt-1">Review contact form inquiries submitted from the frontend.</p>
      </div>

      <div className="bg-white rounded-[20px] border border-gray-200/60 shadow-sm overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-6 border-b border-gray-150 flex justify-between items-center flex-wrap gap-4 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <span className="font-bold text-sm text-text-primary">Status Filter</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-primary bg-white font-semibold"
            >
              <option value="all">All Queries</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-primary w-64 bg-white"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredQueries.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-text-secondary text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Contact Info</th>
                    <th className="px-6 py-4 font-semibold">Subject & Message</th>
                    <th className="px-6 py-4 font-semibold">Date Received</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-sm">
                  {filteredQueries.map((q) => (
                    <tr key={q.id} className={`hover:bg-gray-50/50 transition-colors ${q.status === "unread" ? "bg-primary/5" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-primary">{q.name}</div>
                        <div className="text-xs text-text-secondary">{q.email}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{q.phone}</div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="font-bold text-text-primary truncate">{q.subject || "No Subject"}</div>
                        <div className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-3 whitespace-pre-wrap">{q.message}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-text-secondary whitespace-nowrap">
                        {new Date(q.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(q.id, q.status)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                            q.status === "unread" ? "bg-error/10 text-error" : "bg-success/10 text-success"
                          }`}
                        >
                          {q.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-text-secondary">
                No queries found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
