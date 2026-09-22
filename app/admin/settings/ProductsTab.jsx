"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function ProductsTab() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    button_text: "Start Now",
    button_link: "/portal",
    image_url: "",
    display_order: 0
  });
  const [imgPreview, setImgPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      showToast("Failed to load products.", "error");
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
    fd.append("folder", "products");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, image_url: data.url }));
        showToast("Icon/Image uploaded!", "success");
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
    setForm({
      title: "",
      description: "",
      price: "",
      button_text: "Start Now",
      button_link: "/portal",
      image_url: "",
      display_order: items.length
    });
    setImgPreview(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description || "",
      price: item.price || "",
      button_text: item.button_text || "Start Now",
      button_link: item.button_link || "/portal",
      image_url: item.image_url || "",
      display_order: item.display_order || 0
    });
    setImgPreview(item.image_url || null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || form.title.trim() === '') return showToast("Product title is required.", "error");
    if (form.title.trim().length < 2) return showToast("Title must be at least 2 characters.", "error");
    setSubmitting(true);
    try {
      const isEdit = !!editingItem;
      const payload = isEdit ? { ...form, id: editingItem.id } : form;
      const res = await fetch("/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(isEdit ? "Product updated successfully!" : "Product added successfully!", "success");
        setShowModal(false);
        fetchItems();
      } else {
        showToast(data.error || "Failed to save product. Please try again.", "error");
      }
    } catch (err) {
      showToast("Network error. Please check your connection.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast("Product deleted.", "success");
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
          <h2 className="text-xl font-bold">Featured Products / Services</h2>
          <p className="text-text-secondary text-sm mt-1">Manage cards featured in the Popular Business Services slider.</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          + Add Product Card
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-[20px] p-6 border border-gray-250/60 shadow-sm flex flex-col justify-between relative group hover:-translate-y-1 transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  )}
                </div>
                <h4 className="font-bold text-text-primary text-lg">{item.title}</h4>
                <p className="text-text-secondary text-sm mt-2 line-clamp-3 leading-relaxed">{item.description}</p>
                {item.price && (
                  <p className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded inline-block mt-3">{item.price}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
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
              No product cards added yet.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto anim-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative my-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6">{editingItem ? "Edit Product Card" : "New Product Card"}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-primary">Card Icon/Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                    {imgPreview ? (
                      <img src={imgPreview} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleUpload} className="text-xs text-text-secondary" />
                </div>
                {uploading && <span className="text-xs text-primary font-medium animate-pulse">Uploading...</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Product Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Company Registration" 
                  required 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  className="border border-premium rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Pricing Info (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Starting from Rs. 8,000" 
                  value={form.price} 
                  onChange={e => setForm({...form, price: e.target.value})} 
                  className="border border-premium rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Description</label>
                <textarea 
                  placeholder="Briefly describe the business service..." 
                  rows={3}
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  className="border border-premium rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm resize-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-primary">Button Text</label>
                  <input 
                    type="text" 
                    value={form.button_text} 
                    onChange={e => setForm({...form, button_text: e.target.value})} 
                    className="border border-premium rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-primary">Display Order</label>
                  <input 
                    type="number" 
                    value={form.display_order} 
                    onChange={e => setForm({...form, display_order: parseInt(e.target.value) || 0})} 
                    className="border border-premium rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm" 
                  />
                </div>
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
                  {submitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
