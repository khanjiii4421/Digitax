"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    discountType: "fixed",
    discountValue: "",
    minAmount: "0",
    maxUses: "100",
    expiresAt: ""
  });

  const fetchCoupons = () => {
    setLoading(true);
    fetch("/api/admin/coupons")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCoupons(data.data || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      alert("Please fill in required fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert("Coupon created successfully!");
        setShowModal(false);
        setFormData({ code: "", discountType: "fixed", discountValue: "", minAmount: "0", maxUses: "100", expiresAt: "" });
        fetchCoupons();
      } else {
        setError(data.error || "Failed to create coupon");
      }
    } catch (err) {
      setError("Server error creating coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (confirm(`Are you sure you want to delete coupon code "${code}"?`)) {
      try {
        const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          fetchCoupons();
        } else {
          alert(data.error || "Failed to delete coupon");
        }
      } catch (err) {
        alert("Error deleting coupon");
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Coupons & Marketing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage promotional discount codes for family tax filings and client services.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:scale-105 transition-all cursor-pointer"
        >
          + Create New Coupon
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 font-bold">Code</th>
              <th className="px-6 py-4 font-bold">Discount</th>
              <th className="px-6 py-4 font-bold">Usage</th>
              <th className="px-6 py-4 font-bold">Expiry Date</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">Loading coupons...</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">No discount coupons found. Click above to create one.</td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs tracking-wider">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `PKR ${c.discount_value} OFF`}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {c.used_count} / {c.max_uses > 0 ? c.max_uses : '∞'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'No Expiry'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteCoupon(c.id, c.code)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Discount Coupon</h2>

            {error && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg mb-4">{error}</div>}

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  placeholder="e.g. SAVE1000 or FAMILY20"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Discount Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <option value="fixed">Fixed PKR</option>
                    <option value="percent">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000 or 15"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Max Usage Limit</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.maxUses}
                    onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.expiresAt}
                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-white font-bold px-5 py-2 rounded-lg text-sm hover:bg-primary/90 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
