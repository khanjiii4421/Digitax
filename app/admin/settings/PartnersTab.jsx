"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function PartnersTab() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", display_order: "" });
  const [imgPreview, setImgPreview] = useState(null);
  const [imgUrl, setImgUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = () => {
    fetch("/api/admin/partners")
      .then(r => r.json())
      .then(d => { setItems(d); setLoading(false); })
      .catch(() => { showToast("Failed to load partners.", "error"); setLoading(false); });
  };

  useEffect(() => { fetchItems(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "partners");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) { setImgUrl(data.url); showToast("Image uploaded!", "success"); }
      else showToast("Upload failed.", "error");
    } catch { showToast("Upload error.", "error"); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !imgUrl) return showToast("Name and image are required.", "error");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image_url: imgUrl })
      });
      if (res.ok) {
        showToast("Partner added!", "success");
        setForm({ name: "", display_order: "" });
        setImgPreview(null); setImgUrl("");
        fetchItems();
      } else showToast("Failed to add partner.", "error");
    } catch { showToast("Network error.", "error"); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this partner?")) return;
    const res = await fetch("/api/admin/partners", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { showToast("Deleted.", "success"); fetchItems(); }
    else showToast("Failed to delete.", "error");
  };

  return (
    <div className="flex flex-col gap-8 anim-fade-in max-w-5xl">
      <div>
        <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Partners Logo Management</h2>
        <p className="text-text-secondary text-sm mt-1">Manage partner logos displayed on the homepage.</p>
      </div>

      <div className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm flex flex-col gap-6">
        <h3 className="text-lg font-bold">Add New Partner</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-primary">Partner Logo</label>
              <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                {imgPreview ? <img src={imgPreview} alt="" className="w-full h-full object-contain p-2" /> : <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              </div>
              <input type="file" accept="image/*" onChange={handleUpload} className="text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
              <label className="text-sm font-bold text-text-primary">Partner Name</label>
              <input type="text" placeholder="e.g. Google" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white w-full" />
            </div>
            <div className="flex flex-col gap-2 w-28">
              <label className="text-sm font-bold text-text-primary">Order</label>
              <input type="number" placeholder="0" value={form.display_order} onChange={e => setForm({...form, display_order: e.target.value})} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white w-full" />
            </div>
            <button type="submit" disabled={submitting} className="bg-primary text-white font-bold px-6 py-3 rounded-xl text-sm hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shrink-0">
              {submitting ? "Adding..." : "+ Add Partner"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-[20px] border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 font-bold text-lg">All Partners</div>
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6">
            {items.length > 0 ? items.map(item => (
              <div key={item.id} className="group relative flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                <img src={item.image_url} alt={item.name} className="h-16 object-contain w-full" />
                <p className="text-sm font-medium text-text-primary text-center truncate w-full">{item.name}</p>
                <button onClick={() => handleDelete(item.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-error bg-white rounded-lg shadow-sm transition-opacity cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )) : <p className="col-span-4 text-center text-text-secondary py-8">No partners added yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
