"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function BlogUpdatesPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/portal/blogs")
      .then(r => r.json())
      .then(d => {
        if (d.success) setBlogs(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredBlogs = blogs.filter(b =>
    !search.trim() ||
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-20 anim-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">Tax Insights, News & Business Guides</h1>
        <p className="text-text-secondary text-sm mt-1">Stay updated with the latest FBR tax laws, notifications, corporate legal procedures, and tax-saving strategies.</p>

        <div className="max-w-md mt-6 relative">
          <input
            type="text"
            placeholder="Search articles & updates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBlogs.map(blog => (
            <div key={blog.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="p-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full inline-block mb-3">
                  {blog.category || 'Tax Insights'}
                </span>
                <h3 className="font-bold text-lg text-text-primary mb-2 line-clamp-2">{blog.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-4">{blog.description}</p>
              </div>
              <div className="px-6 pb-6 pt-2 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">By DigiTax Research Team</span>
                <Link
                  href={blog.link || '/portal/services'}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Read Guide →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
