"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function VideosTab() {
  const { showToast } = useToast();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", url: "" });

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/admin/videos");
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch {
      showToast("Failed to load videos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.url) return showToast("All fields are required.", "error");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast("Video added successfully!", "success");
        setForm({ title: "", url: "" });
        fetchVideos();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to add video.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      const res = await fetch("/api/admin/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast("Video deleted.", "success");
        fetchVideos();
      } else {
        showToast("Failed to delete video.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-8 anim-fade-in max-w-5xl">
      <div>
        <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Video Management</h2>
        <p className="text-text-secondary text-sm mt-1">Manage YouTube videos featured on the site.</p>
      </div>

      <div className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Add New Video</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary ml-1">Video Title</label>
              <input type="text" placeholder="Video Title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white transition-colors text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary ml-1">YouTube URL</label>
              <input type="url" placeholder="YouTube URL (e.g. https://youtube.com/watch?v=...)" required value={form.url} onChange={e => setForm({...form, url: e.target.value})} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white transition-colors text-sm" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="bg-primary text-white font-bold py-3 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer w-full md:w-auto md:px-8 md:self-end text-sm shadow-md">
            {submitting ? "Adding..." : "Add Video"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <div key={video.id} className="bg-white rounded-[20px] border border-gray-250/60 shadow-sm overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300">
              <div className="relative aspect-video">
                <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-primary backdrop-blur-sm shadow-lg">
                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <h3 className="font-bold text-text-primary leading-tight line-clamp-2">{video.title}</h3>
                <button type="button" onClick={() => handleDelete(video.id)} className="text-error font-medium text-sm hover:underline flex items-center gap-1 mt-auto">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Remove Video
                </button>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="col-span-full py-12 text-center text-text-secondary bg-white rounded-[20px] border border-gray-250/60 shadow-sm">
              No videos added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
