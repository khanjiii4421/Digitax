"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function ServicesAdminClient({ initialCategories, initialServices }) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState(initialCategories || []);
  const [services, setServices] = useState(initialServices || []);
  const [activeSubTab, setActiveSubTab] = useState("services"); // "services" or "categories"

  // Service Form State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    category_id: "",
    title: "",
    price: "",
    working_days: "",
    description: "",
    requirements: "",
    icon_url: "",
    status: "active",
  });
  const [serviceImgPreview, setServiceImgPreview] = useState(null);
  const [serviceUploading, setServiceUploading] = useState(false);
  const [serviceSaving, setServiceSaving] = useState(false);

  // Category Form State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      showToast("Failed to refresh categories.", "error");
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/admin/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      showToast("Failed to refresh services.", "error");
    }
  };

  // ----------------------------------------------------
  // Category Handlers
  // ----------------------------------------------------
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryName(cat.name);
    } else {
      setEditingCategory(null);
      setCategoryName("");
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return showToast("Category name is required.", "error");
    setCategorySaving(true);
    try {
      const url = "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";
      const body = editingCategory
        ? { id: editingCategory.id, name: categoryName }
        : { name: categoryName };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast(
          editingCategory ? "Category updated successfully!" : "Category created successfully!",
          "success"
        );
        setShowCategoryModal(false);
        fetchCategories();
      } else {
        showToast("Failed to save category.", "error");
      }
    } catch {
      showToast("Network error saving category.", "error");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (
      !confirm(
        `Are you sure you want to delete category "${name}"? WARNING: This will also delete ALL services listed under this category.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Category and its services deleted.", "success");
        fetchCategories();
        fetchServices();
      } else {
        showToast("Failed to delete category.", "error");
      }
    } catch {
      showToast("Network error deleting category.", "error");
    }
  };

  // ----------------------------------------------------
  // Service Handlers
  // ----------------------------------------------------
  const handleOpenServiceModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        category_id: service.category_id || "",
        title: service.title || "",
        price: service.price || "",
        working_days: service.working_days || "",
        description: service.description || "",
        requirements: service.requirements || "",
        icon_url: service.icon_url || "",
        status: service.status || "active",
      });
      setServiceImgPreview(service.icon_url || null);
    } else {
      setEditingService(null);
      setServiceForm({
        category_id: categories[0]?.id || "",
        title: "",
        price: "",
        working_days: "",
        description: "",
        requirements: "",
        icon_url: "",
        status: "active",
      });
      setServiceImgPreview(null);
    }
    setShowServiceModal(true);
  };

  const handleServiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      return showToast("Only JPG, PNG, WebP, and SVG files are supported.", "error");
    }

    setServiceImgPreview(URL.createObjectURL(file));
    setServiceUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "services");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setServiceForm((prev) => ({ ...prev, icon_url: data.url }));
        showToast("Icon uploaded successfully!", "success");
      } else {
        showToast(data.error || "Upload failed.", "error");
      }
    } catch (err) {
      showToast("Upload failed. Please try again.", "error");
    } finally {
      setServiceUploading(false);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.category_id) return showToast("Please select a category.", "error");
    if (!serviceForm.title.trim()) return showToast("Service title is required.", "error");
    if (!serviceForm.price.trim()) return showToast("Price is required.", "error");
    if (!serviceForm.working_days.trim()) return showToast("Working days is required.", "error");

    setServiceSaving(true);
    try {
      const url = "/api/admin/services";
      const method = editingService ? "PUT" : "POST";
      const body = editingService
        ? { ...serviceForm, id: editingService.id }
        : serviceForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast(
          editingService ? "Service updated successfully!" : "Service created successfully!",
          "success"
        );
        setShowServiceModal(false);
        fetchServices();
      } else {
        showToast("Failed to save service.", "error");
      }
    } catch {
      showToast("Network error saving service.", "error");
    } finally {
      setServiceSaving(false);
    }
  };

  const handleDeleteService = async (id, title) => {
    if (!confirm(`Are you sure you want to delete service "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/services?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Service deleted successfully.", "success");
        fetchServices();
      } else {
        showToast("Failed to delete service.", "error");
      }
    } catch {
      showToast("Network error deleting service.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 anim-fade-in max-w-5xl">
      {/* Sub Tabs Toggle */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab("services")}
          className={`px-6 py-3 font-bold text-sm border-b-2 -mb-px transition-all cursor-pointer ${
            activeSubTab === "services"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-primary"
          }`}
        >
          Manage Services
        </button>
        <button
          onClick={() => setActiveSubTab("categories")}
          className={`px-6 py-3 font-bold text-sm border-b-2 -mb-px transition-all cursor-pointer ${
            activeSubTab === "categories"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-primary"
          }`}
        >
          Manage Categories
        </button>
      </div>

      {/* Services Sub-Tab Content */}
      {activeSubTab === "services" && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-text-primary">All Services</h3>
              <p className="text-text-secondary text-xs mt-0.5">
                Total services listed: {services.length}
              </p>
            </div>
            <button
              onClick={() => handleOpenServiceModal(null)}
              className="bg-primary text-white font-bold px-6 py-3 rounded-xl text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              + Add New Service
            </button>
          </div>

          <div className="flex flex-col gap-10">
            {categories.map((category) => {
              const categoryServices = services.filter((s) => s.category_id === category.id);
              return (
                <div
                  key={category.id}
                  className="bg-white rounded-[20px] border border-gray-200/60 shadow-sm overflow-hidden"
                >
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
                    <h4 className="font-bold text-text-primary text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {categoryServices.length}
                      </span>
                      {category.name}
                    </h4>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {categoryServices.length > 0 ? (
                      categoryServices.map((service) => (
                        <div
                          key={service.id}
                          className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/40 transition-colors"
                        >
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0 overflow-hidden border border-gray-100">
                              {service.icon_url ? (
                                <img
                                  src={service.icon_url}
                                  alt=""
                                  className="w-full h-full object-contain p-2"
                                />
                              ) : (
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h5 className="font-bold text-text-primary text-lg truncate">
                                  {service.title}
                                </h5>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    service.status === "active"
                                      ? "bg-success/10 text-success"
                                      : "bg-error/10 text-error"
                                  }`}
                                >
                                  {service.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-semibold text-text-secondary mt-1 flex-wrap">
                                <span className="bg-gray-100 px-2 py-0.5 rounded-md text-text-primary">
                                  Price: {service.price}
                                </span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded-md text-text-primary">
                                  Duration: {service.working_days}
                                </span>
                              </div>
                              <p className="text-text-secondary text-sm mt-2 line-clamp-2 leading-relaxed">
                                {service.description}
                              </p>
                              {service.requirements && (
                                <div className="mt-3">
                                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                    Requirements:
                                  </span>
                                  <ul className="list-disc pl-4 text-xs text-text-secondary mt-1 flex flex-col gap-0.5">
                                    {service.requirements
                                      .split("\n")
                                      .filter(Boolean)
                                      .slice(0, 3)
                                      .map((req, rIdx) => (
                                        <li key={rIdx}>{req}</li>
                                      ))}
                                    {service.requirements.split("\n").filter(Boolean).length > 3 && (
                                      <li className="list-none text-[10px] font-bold text-primary">
                                        +{" "}
                                        {service.requirements.split("\n").filter(Boolean).length - 3}{" "}
                                        more
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-4 md:pt-0 border-t border-gray-100 md:border-0">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenServiceModal(service)}
                                className="px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/5 border border-primary/20 rounded-xl transition-all cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteService(service.id, service.title)}
                                className="px-3.5 py-2 text-xs font-bold text-error hover:bg-error/5 border border-error/20 rounded-xl transition-all cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="p-6 text-center text-text-secondary text-sm">
                        No services added in this category yet.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <div className="text-center py-12 bg-white rounded-[20px] border border-gray-200/60 shadow-sm">
                <p className="text-text-secondary text-sm">
                  Please add at least one service category first before adding services.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Sub-Tab Content */}
      {activeSubTab === "categories" && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Service Categories</h3>
              <p className="text-text-secondary text-xs mt-0.5">
                Organize services into parent headings on the website.
              </p>
            </div>
            <button
              onClick={() => handleOpenCategoryModal(null)}
              className="bg-primary text-white font-bold px-6 py-3 rounded-xl text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              + Add Category
            </button>
          </div>

          <div className="bg-white rounded-[20px] border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-text-secondary text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Category ID</th>
                    <th className="px-6 py-4 font-semibold">Category Name</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-sm">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-xs text-text-secondary">
                          #{cat.id}
                        </td>
                        <td className="px-6 py-4 font-bold text-text-primary">{cat.name}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenCategoryModal(cat)}
                            className="px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="px-3 py-1.5 text-xs font-bold text-error hover:bg-error/5 rounded-lg transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-text-secondary">
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Category Add/Edit Modal */}
      {/* ---------------------------------------------------- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 anim-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-6 right-6 text-text-secondary hover:text-primary text-2xl leading-none cursor-pointer"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-2">
              {editingCategory ? "Rename Category" : "Add New Category"}
            </h3>
            <p className="text-text-secondary text-xs mb-6 border-b border-gray-100 pb-4">
              {editingCategory
                ? "Update the display name of this category."
                : "Create a new parent category for grouping services."}
            </p>
            <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary ml-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Income Tax Filing"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="bg-white border border-gray-200 text-text-primary px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-55 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySaving}
                  className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-md"
                >
                  {categorySaving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Service Add/Edit Modal */}
      {/* ---------------------------------------------------- */}
      {showServiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto anim-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl p-8 relative my-8">
            <button
              onClick={() => setShowServiceModal(false)}
              className="absolute top-6 right-6 text-text-secondary hover:text-primary text-2xl leading-none cursor-pointer"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-2">
              {editingService ? "Edit Service" : "Add New Service"}
            </h3>
            <p className="text-text-secondary text-xs mb-6 border-b border-gray-100 pb-4">
              Fill in the service details. Changes will reflect live on the website.
            </p>
            <form onSubmit={handleSaveService} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-primary ml-1">Category</label>
                  <select
                    value={serviceForm.category_id}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, category_id: e.target.value })
                    }
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white text-sm cursor-pointer font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-primary ml-1">Service Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Filer Registration (Individual)"
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-primary ml-1">Price</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rs. 2,500"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-primary ml-1">Working Days</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3-5 Working Days"
                    value={serviceForm.working_days}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, working_days: e.target.value })
                    }
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-primary ml-1">Icon Upload</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {serviceImgPreview ? (
                      <img
                        src={serviceImgPreview}
                        alt="Preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleServiceUpload}
                      className="text-xs text-text-secondary file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    <span className="text-[10px] text-text-secondary">
                      Supports PNG, SVG, JPG or WebP
                    </span>
                    {serviceUploading && (
                      <span className="text-[10px] text-primary font-bold animate-pulse">
                        Uploading icon...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary ml-1">Description</label>
                <textarea
                  placeholder="Provide a detailed description of this service..."
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, description: e.target.value })
                  }
                  className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white text-sm resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary ml-1">
                  Requirements (One per line)
                </label>
                <textarea
                  placeholder="e.g. Copy of CNIC&#10;Copy of Utility Bill&#10;Active Email Address"
                  rows={4}
                  value={serviceForm.requirements}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, requirements: e.target.value })
                  }
                  className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary w-full bg-gray-50 focus:bg-white text-sm font-sans resize-none"
                />
              </div>

              <div className="flex items-center gap-6 mt-1 ml-1">
                <span className="text-xs font-bold text-text-primary">Service Status</span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={serviceForm.status === "active"}
                    onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value })}
                    className="accent-primary"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={serviceForm.status === "inactive"}
                    onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value })}
                    className="accent-primary"
                  />
                  Inactive
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="bg-white border border-gray-200 text-text-primary px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-55 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={serviceSaving || serviceUploading}
                  className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-md"
                >
                  {serviceSaving ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
