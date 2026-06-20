"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function SEOTab() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    seo_og_image: "",
    seo_robots: "index, follow",
    seo_canonical: "",
  });
  const [ogPreview, setOgPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        const map = {};
        data.forEach(item => { map[item.key] = item.value; });
        setForm({
          seo_title: map.seo_title || "",
          seo_description: map.seo_description || "",
          seo_keywords: map.seo_keywords || "",
          seo_og_image: map.seo_og_image || "",
          seo_robots: map.seo_robots || "index, follow",
          seo_canonical: map.seo_canonical || "",
        });
        if (map.seo_og_image) setOgPreview(map.seo_og_image);
        setLoading(false);
      })
      .catch(() => {
        showToast("Failed to load SEO settings.", "error");
        setLoading(false);
      });
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOgPreview(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "seo");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, seo_og_image: data.url }));
        showToast("OG image uploaded!", "success");
      } else {
        showToast("Upload failed.", "error");
      }
    } catch {
      showToast("Upload error.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("SEO settings saved!", "success");
      } else {
        showToast("Failed to save SEO settings.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 anim-fade-in max-w-4xl">
      <div>
        <h2 className="text-xl font-bold border-b border-gray-100 pb-4">SEO Settings</h2>
        <p className="text-text-secondary text-sm mt-1">Search engine optimization and meta tag configuration.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm text-text-primary">Page Title (SEO)</label>
          <input
            type="text"
            value={form.seo_title}
            onChange={e => setForm({ ...form, seo_title: e.target.value })}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full"
            placeholder="DIGITAX — Pakistan's Premier Tax Consultants"
          />
          <span className="text-xs text-text-secondary">{form.seo_title.length}/60 characters recommended</span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm text-text-primary">Meta Description</label>
          <textarea
            rows={3}
            value={form.seo_description}
            onChange={e => setForm({ ...form, seo_description: e.target.value })}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full resize-none"
            placeholder="Expert tax filing, NTN & company registration..."
          />
          <span className="text-xs text-text-secondary">{form.seo_description.length}/160 characters recommended</span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm text-text-primary">Keywords</label>
          <input
            type="text"
            value={form.seo_keywords}
            onChange={e => setForm({ ...form, seo_keywords: e.target.value })}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full"
            placeholder="tax filing, NTN registration, company registration, FBR"
          />
          <span className="text-xs text-text-secondary">Comma-separated keywords</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm text-text-primary">Robots Meta Tag</label>
            <select
              value={form.seo_robots}
              onChange={e => setForm({ ...form, seo_robots: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full cursor-pointer"
            >
              <option value="index, follow">Index, Follow (Recommended)</option>
              <option value="noindex, follow">Noindex, Follow</option>
              <option value="index, nofollow">Index, Nofollow</option>
              <option value="noindex, nofollow">Noindex, Nofollow</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm text-text-primary">Canonical URL</label>
            <input
              type="url"
              value={form.seo_canonical}
              onChange={e => setForm({ ...form, seo_canonical: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full"
              placeholder="https://digitax.pk"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm text-text-primary">OG / Social Share Image</label>
          <div className="flex flex-wrap items-center gap-6">
            <div className="w-40 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {ogPreview ? (
                <img src={ogPreview} alt="OG Image" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input type="file" accept="image/*" onChange={handleUpload} className="text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer" />
              <span className="text-xs text-text-secondary">Recommended: 1200×630px (JPG or PNG)</span>
              {uploading && <span className="text-xs text-primary font-medium animate-pulse">Uploading...</span>}
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Google Search Preview</p>
          <div className="flex flex-col gap-1">
            <p className="text-[#1a0dab] text-base font-medium truncate">{form.seo_title || "Page Title"}</p>
            <p className="text-[#006621] text-sm truncate">{form.seo_canonical || "https://digitax.pk"}</p>
            <p className="text-text-secondary text-sm line-clamp-2">{form.seo_description || "Meta description will appear here..."}</p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer text-sm shadow-md"
          >
            {saving ? "Saving..." : "Save SEO Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
