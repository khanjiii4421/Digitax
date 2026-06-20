"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function TaxSlabsTab() {
  const { showToast } = useToast();
  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [years, setYears] = useState(["2024", "2023", "2022", "2021"]);
  const [selectedYear, setSelectedYear] = useState("2024");
  const [newCustomYear, setNewCustomYear] = useState("");
  const [showYearInput, setShowYearInput] = useState(false);

  const [form, setForm] = useState({
    tax_year: "2024",
    salary_from: "",
    salary_to: "",
    tax_amount: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    tax_year: "",
    salary_from: "",
    salary_to: "",
    tax_amount: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const fetchSlabs = async () => {
    try {
      const res = await fetch("/api/admin/tax-slabs");
      if (res.ok) {
        const data = await res.json();
        setSlabs(data);
        const dbYears = [...new Set(data.map((s) => s.tax_year))];
        const combinedYears = Array.from(new Set([...years, ...dbYears])).sort((a, b) => b.localeCompare(a));
        setYears(combinedYears);
      } else {
        showToast("Failed to load tax slabs.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlabs();
  }, []);

  const handleAddYear = (e) => {
    e.preventDefault();
    if (!newCustomYear || !/^\d{4}$/.test(newCustomYear)) {
      return showToast("Please enter a valid 4-digit year.", "error");
    }
    if (years.includes(newCustomYear)) {
      return showToast("Tax year already exists.", "error");
    }
    const updatedYears = [newCustomYear, ...years].sort((a, b) => b.localeCompare(a));
    setYears(updatedYears);
    setSelectedYear(newCustomYear);
    setForm({ ...form, tax_year: newCustomYear });
    setNewCustomYear("");
    setShowYearInput(false);
    showToast(`Year ${newCustomYear} added to filters.`, "success");
  };

  const handleAddSlab = async (e) => {
    e.preventDefault();
    if (form.salary_from === "" || form.salary_to === "" || form.tax_amount === "") {
      return showToast("All fields are required.", "error");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/tax-slabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("Tax slab added successfully!", "success");
        setForm({
          tax_year: selectedYear,
          salary_from: "",
          salary_to: "",
          tax_amount: "",
        });
        fetchSlabs();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to add tax slab.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (slab) => {
    setEditingId(slab.id);
    setEditForm({
      tax_year: slab.tax_year,
      salary_from: slab.salary_from,
      salary_to: slab.salary_to,
      tax_amount: slab.tax_amount,
    });
  };

  const handleSaveEdit = async (id) => {
    if (editForm.salary_from === "" || editForm.salary_to === "" || editForm.tax_amount === "") {
      return showToast("All fields are required.", "error");
    }
    try {
      const res = await fetch("/api/admin/tax-slabs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      });
      if (res.ok) {
        showToast("Tax slab updated successfully!", "success");
        setEditingId(null);
        fetchSlabs();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update tax slab.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
    }
  };

  const handleDeleteSlab = async (id) => {
    if (!confirm("Are you sure you want to delete this tax slab?")) return;
    try {
      const res = await fetch("/api/admin/tax-slabs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast("Tax slab deleted.", "success");
        fetchSlabs();
      } else {
        showToast("Failed to delete slab.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
    }
  };

  const filteredSlabs = slabs.filter((slab) => {
    const matchesYear = slab.tax_year === selectedYear;
    const matchesSearch =
      slab.salary_from.toString().includes(searchTerm) ||
      slab.salary_to.toString().includes(searchTerm) ||
      slab.tax_amount.toString().includes(searchTerm);
    return matchesYear && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8 anim-fade-in max-w-5xl">
      <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold">Tax Slabs Management</h2>
          <p className="text-text-secondary text-sm mt-1">Configure income tax slabs for client calculator models.</p>
        </div>

        <div className="flex items-center gap-3">
          {showYearInput ? (
            <form onSubmit={handleAddYear} className="flex gap-2">
              <input
                type="number"
                placeholder="e.g. 2025"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-primary w-28 bg-white"
                value={newCustomYear}
                onChange={(e) => setNewCustomYear(e.target.value)}
              />
              <button
                type="submit"
                className="bg-primary text-white font-bold px-3 py-2 rounded-xl text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Add Year
              </button>
              <button
                type="button"
                onClick={() => setShowYearInput(false)}
                className="bg-gray-100 border border-gray-200 text-text-primary font-bold px-3 py-2 rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowYearInput(true)}
              className="bg-white border border-gray-200 text-text-primary hover:bg-gray-50 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              + Add Custom Year
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-text-primary">Create New Slab for Year {selectedYear}</h3>
        <form onSubmit={handleAddSlab} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-primary ml-1">Tax Year</label>
            <select
              value={form.tax_year}
              onChange={(e) => {
                setForm({ ...form, tax_year: e.target.value });
                setSelectedYear(e.target.value);
              }}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y} - {parseInt(y) + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-primary ml-1">Salary From (Rs)</label>
            <input
              type="number"
              value={form.salary_from}
              onChange={(e) => setForm({ ...form, salary_from: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 text-sm w-full"
              placeholder="e.g. 50000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-primary ml-1">Salary To (Rs)</label>
            <input
              type="number"
              value={form.salary_to}
              onChange={(e) => setForm({ ...form, salary_to: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 text-sm w-full"
              placeholder="e.g. 100000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-primary ml-1">Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={form.tax_amount}
              onChange={(e) => setForm({ ...form, tax_amount: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 text-sm w-full"
              placeholder="e.g. 5.5"
            />
          </div>
          <div className="col-span-1 md:col-span-4 flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
            >
              {submitting ? "Saving..." : "+ Create Slab"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-[20px] border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-150 flex justify-between items-center flex-wrap gap-4 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg text-text-primary">Tax Slabs Listing</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setForm((prev) => ({ ...prev, tax_year: e.target.value }));
              }}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-primary bg-white font-semibold"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  Year: {y}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Search slabs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-primary w-52 bg-white"
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-text-secondary text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Salary range</th>
                  <th className="px-6 py-4 font-semibold">Tax Rate</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm">
                {filteredSlabs.length > 0 ? (
                  filteredSlabs.map((s) => {
                    const isEditing = editingId === s.id;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editForm.salary_from}
                                onChange={(e) => setEditForm({ ...editForm, salary_from: e.target.value })}
                                className="border border-gray-250 rounded-lg px-2 py-1 text-xs w-28 focus:outline-primary bg-white"
                              />
                              <span className="text-text-secondary">to</span>
                              <input
                                type="number"
                                value={editForm.salary_to}
                                onChange={(e) => setEditForm({ ...editForm, salary_to: e.target.value })}
                                className="border border-gray-250 rounded-lg px-2 py-1 text-xs w-28 focus:outline-primary bg-white"
                              />
                            </div>
                          ) : (
                            <div className="font-medium text-text-primary">
                              Rs {Number(s.salary_from).toLocaleString()} - Rs {Number(s.salary_to).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.tax_amount}
                              onChange={(e) => setEditForm({ ...editForm, tax_amount: e.target.value })}
                              className="border border-gray-250 rounded-lg px-2 py-1 text-xs w-16 focus:outline-primary bg-white"
                            />
                          ) : (
                            <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs">
                              {s.tax_amount}%
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSaveEdit(s.id)}
                                className="bg-success text-white px-3 py-1 rounded-lg text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-100 border border-gray-250 text-text-primary px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleStartEdit(s)}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteSlab(s.id)}
                                className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-text-secondary text-sm">
                      No tax slabs configured for Year {selectedYear}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
