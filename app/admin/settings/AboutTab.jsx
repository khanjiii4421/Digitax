"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function AboutTab() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    about_title: "",
    about_description: "",
    about_image: "",
    about_enabled: "1",
  });
  const [imgPreview, setImgPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        const settingsMap = {};
        data.forEach(item => {
          settingsMap[item.key] = item.value;
        });
        setForm({
          about_title: settingsMap.about_title || "About DIGITAX",
          about_description: settingsMap.about_description || "",
          about_image: settingsMap.about_image || "",
          about_enabled: settingsMap.about_enabled || "1",
        });
        if (settingsMap.about_image) {
          setImgPreview(settingsMap.about_image);
        }
        setLoading(false);
      })
      .catch(() => {
        showToast("Failed to load About settings.", "error");
        setLoading(false);
      });
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImgPreview(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "about");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, about_image: data.url }));
        showToast("Image uploaded!", "success");
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
        showToast("About section settings saved!", "success");
      } else {
        showToast("Failed to save settings.", "error");
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
        <h2 className="text-xl font-bold border-b border-gray-100 pb-4">About Section</h2>
        <p className="text-text-secondary text-sm mt-1">Configure About Us section content displayed on the homepage.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <span className="font-bold text-text-primary">Enable Section</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={form.about_enabled === "1"} 
              onChange={e => setForm({ ...form, about_enabled: e.target.checked ? "1" : "0" })} 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm text-text-primary">Section Title</label>
          <input 
            type="text" 
            required 
            value={form.about_title} 
            onChange={e => setForm({ ...form, about_title: e.target.value })} 
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" 
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm text-text-primary">Section Description / About Text</label>
          <textarea 
            required 
            rows={6} 
            value={form.about_description} 
            onChange={e => setForm({ ...form, about_description: e.target.value })} 
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full resize-none" 
            placeholder="Write details about your law firm/business consultancies..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm text-text-primary">About Section Image</label>
          <div className="flex flex-wrap items-center gap-6">
            <div className="w-40 h-28 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {imgPreview ? (
                <img src={imgPreview} alt="About Us" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer"
              />
              <span className="text-xs text-text-secondary">Upload an illustrative image (JPG, PNG, WebP)</span>
              {uploading && <span className="text-xs text-primary font-medium animate-pulse">Uploading...</span>}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer text-sm shadow-md"
          >
            {saving ? "Saving..." : "Save About Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
