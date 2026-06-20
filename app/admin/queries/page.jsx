"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function QueriesAdmin() {
  const { showToast } = useToast();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuery, setExpandedQuery] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchQueries = async () => {
    try {
      const res = await fetch("/api/admin/queries");
      if (res.ok) {
        const data = await res.json();
        // Fetch replies for each query
        const withReplies = await Promise.all(data.map(async (q) => {
          try {
            const rRes = await fetch(`/api/admin/query-replies?query_id=${q.id}`);
            const replies = rRes.ok ? await rRes.json() : [];
            return { ...q, replies };
          } catch { return { ...q, replies: [] }; }
        }));
        setQueries(withReplies);
      } else {
        showToast("Failed to fetch inquiries.", "error");
      }
    } catch (err) {
      showToast("Error loading inquiries.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch("/api/admin/queries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        showToast("Status updated successfully.", "success");
        fetchQueries();
      } else {
        showToast("Failed to update status.", "error");
      }
    } catch (err) {
      showToast("Error updating status.", "error");
    }
  };

  const handleReply = async (queryId) => {
    if (!replyText.trim()) return showToast("Please enter a reply.", "error");
    setReplying(true);
    try {
      const res = await fetch("/api/admin/queries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: queryId, reply_message: replyText }),
      });
      if (res.ok) {
        showToast("Reply sent successfully!", "success");
        setReplyText('');
        setExpandedQuery(null);
        fetchQueries();
      } else {
        showToast("Failed to send reply.", "error");
      }
    } catch (err) {
      showToast("Error sending reply.", "error");
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch("/api/admin/queries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast("Inquiry deleted successfully.", "success");
        fetchQueries();
      } else {
        showToast("Failed to delete inquiry.", "error");
      }
    } catch (err) {
      showToast("Error deleting inquiry.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-8 anim-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Sales Queries</h1>
        <p className="text-text-secondary text-sm">Manage and respond to client requests.</p>
      </div>

      <div className="bg-white rounded-[20px] border border-premium shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="divide-y divide-premium">
              {queries.length > 0 ? (
                queries.map((query) => (
                  <div key={query.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Details */}
                      <div className="md:w-1/4">
                        <div className="font-bold text-text-primary">{query.name}</div>
                        <div className="text-sm text-text-secondary mt-1">{query.email}</div>
                        {query.phone && <div className="text-sm text-text-secondary">{query.phone}</div>}
                        <div className="text-xs text-text-secondary mt-2">
                          {new Date(query.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* Subject & Message */}
                      <div className="flex-1">
                        <div className="font-bold text-text-primary mb-2">{query.subject}</div>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{query.message}</p>
                        
                        {/* Replies */}
                        {query.replies && query.replies.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Conversation</h4>
                            {query.replies.map((reply) => (
                              <div key={reply.id} className={`p-3 rounded-xl text-sm ${reply.sender_type === 'admin' ? 'bg-primary/5 border border-primary/10' : 'bg-gray-50 border border-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${reply.sender_type === 'admin' ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-700'}`}>
                                    {reply.sender_type === 'admin' ? 'Admin' : 'Client'}
                                  </span>
                                  <span className="text-xs text-text-secondary">{new Date(reply.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-text-primary">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Form */}
                        {expandedQuery === query.id && (
                          <div className="mt-4 flex flex-col gap-3">
                            <textarea
                              placeholder="Type your reply to the client..."
                              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-primary resize-none w-full min-h-[100px]"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReply(query.id)}
                                disabled={replying}
                                className="bg-primary text-white font-bold px-5 py-2 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                              >
                                {replying ? 'Sending...' : 'Send Reply'}
                              </button>
                              <button
                                onClick={() => { setExpandedQuery(null); setReplyText(''); }}
                                className="border border-gray-200 text-text-primary font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status & Actions */}
                      <div className="md:w-1/5 flex flex-col items-end gap-3">
                        <select
                          value={query.status}
                          onChange={(e) => handleUpdateStatus(query.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border-0 cursor-pointer ${
                            query.status === "unread" ? "bg-error/10 text-error" : "bg-success/10 text-success"
                          }`}
                        >
                          <option value="unread">Unread</option>
                          <option value="replied">Replied</option>
                        </select>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedQuery(expandedQuery === query.id ? null : query.id)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            title="Reply via Portal"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                          <a
                            href={`mailto:${query.email}?subject=RE: ${query.subject}`}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Reply via Email Client"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </a>
                          <button
                            onClick={() => handleDelete(query.id)}
                            className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-text-secondary">
                  No queries found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
