"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function TestimonialsTab() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    role: "",
    review: "",
    photo_url: ""
  });
  const [imgPreview, setImgPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/testimonials");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      showToast("Failed to load testimonials.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImgPreview(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "testimonials");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, photo_url: data.url }));
        showToast("Photo uploaded!", "success");
      } else {
        showToast("Upload failed.", "error");
      }
    } catch {
      showToast("Upload error.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({ name: "", role: "", review: "", photo_url: "" });
    setImgPreview(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      role: item.role,
      review: item.review,
      photo_url: item.photo_url || ""
    });
    setImgPreview(item.photo_url || null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.review) return showToast("Name and review are required.", "error");
    setSubmitting(true);
    try {
      const isEdit = !!editingItem;
      const res = await fetch("/api/admin/testimonials", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...form, id: editingItem.id } : form)
      });
      if (res.ok) {
        showToast(isEdit ? "Testimonial updated!" : "Testimonial added!", "success");
        setShowModal(false);
        fetchItems();
      } else {
        showToast("Failed to save testimonial.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast("Testimonial deleted.", "success");
        fetchItems();
      } else {
        showToast("Failed to delete.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-8 anim-fade-in max-w-5xl">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold">Client Testimonials</h2>
          <p className="text-text-secondary text-sm mt-1">Manage client reviews displayed on the homepage.</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          + Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-[20px] p-6 border border-gray-250/60 shadow-sm flex flex-col justify-between relative group hover:-translate-y-1 transition-all duration-300">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                  {item.photo_url ? (
                    <img src={item.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-lg">{item.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">{item.name}</h4>
                  <p className="text-xs text-primary font-medium">{item.role}</p>
                  <p className="text-text-secondary text-sm mt-3 italic leading-relaxed">"{item.review}"</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenEdit(item)} 
                  className="text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(item.id)} 
                  className="text-error hover:bg-error/5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-12 text-center text-text-secondary bg-white rounded-[20px] border border-gray-200/60 shadow-sm">
              No testimonials added yet.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto anim-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative my-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6">{editingItem ? "Edit Testimonial" : "New Testimonial"}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-primary">Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center">
                    {imgPreview ? (
                      <img src={imgPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-text-secondary text-xs">No Photo</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleUpload} className="text-xs text-text-secondary" />
                </div>
                {uploading && <span className="text-xs text-primary font-medium animate-pulse">Uploading photo...</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Client Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sarah J." 
                  required 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="border border-premium rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Client Role / Designation</label>
                <input 
                  type="text" 
                  placeholder="e.g. Business Owner" 
                  value={form.role} 
                  onChange={e => setForm({...form, role: e.target.value})} 
                  className="border border-premium rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Review Comment</label>
                <textarea 
                  placeholder="Describe client's experience..." 
                  required 
                  rows={4}
                  value={form.review} 
                  onChange={e => setForm({...form, review: e.target.value})} 
                  className="border border-premium rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm resize-none" 
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-3 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-primary/30 shadow-sm hover-scale text-sm"
                >
                  {submitting ? "Saving..." : "Save Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
