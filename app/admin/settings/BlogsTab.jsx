"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function BlogsTab() {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", link: "" });

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/admin/blogs");
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch {
      showToast("Failed to load blogs.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.link) return showToast("Title and link are required.", "error");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast("Blog added successfully!", "success");
        setForm({ title: "", description: "", image_url: "", link: "" });
        fetchBlogs();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to add blog.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast("Blog deleted.", "success");
        fetchBlogs();
      } else {
        showToast("Failed to delete blog.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-8 anim-fade-in max-w-5xl">
      <div>
        <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Blog Management</h2>
        <p className="text-text-secondary text-sm mt-1">Manage blog posts featured on the homepage below videos.</p>
      </div>

      <div className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Add New Blog Post</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary ml-1">Blog Title</label>
              <input type="text" placeholder="Blog Title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white transition-colors text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary ml-1">Blog Link / URL</label>
              <input type="url" placeholder="https://example.com/blog-post" required value={form.link} onChange={e => setForm({...form, link: e.target.value})} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white transition-colors text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary ml-1">Image URL (Optional)</label>
              <input type="url" placeholder="https://example.com/image.jpg" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white transition-colors text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary ml-1">Display Order</label>
              <input type="number" placeholder="0" value={form.display_order || ""} onChange={e => setForm({...form, display_order: parseInt(e.target.value) || 0})} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white transition-colors text-sm" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-primary ml-1">Description (Optional)</label>
            <textarea placeholder="Short description of the blog post..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white transition-colors text-sm resize-none" />
          </div>
          <button type="submit" disabled={submitting} className="bg-primary text-white font-bold py-3 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer w-full md:w-auto md:px-8 md:self-end text-sm shadow-md">
            {submitting ? "Adding..." : "Add Blog Post"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {blogs.map(blog => (
            <div key={blog.id} className="bg-white rounded-[20px] border border-gray-250/60 shadow-sm overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300">
              {blog.image_url ? (
                <div className="relative aspect-[16/9]">
                  <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <svg className="w-12 h-12 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-bold text-text-primary leading-tight line-clamp-2">{blog.title}</h3>
                  {blog.description && <p className="text-text-secondary text-sm mt-1 line-clamp-2">{blog.description}</p>}
                  {blog.link && <a href={blog.link} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-medium mt-2 inline-block hover:underline">View Blog →</a>}
                </div>
                <button type="button" onClick={() => handleDelete(blog.id)} className="text-error font-medium text-sm hover:underline flex items-center gap-1 mt-auto">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Remove Blog
                </button>
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div className="col-span-full py-12 text-center text-text-secondary bg-white rounded-[20px] border border-gray-250/60 shadow-sm">
              No blog posts added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
