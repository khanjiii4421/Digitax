"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function SalesTaxForm() {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    businessName: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      return showToast("Please fill in all required fields.", "error");
    }

    setSubmitting(true);
    try {
      const subject = form.businessName
        ? `Sales Tax Inquiry - ${form.businessName}`
        : "Sales Tax Registration & Filing Inquiry";
      
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Inquiry submitted successfully! Our tax expert will contact you.", "success");
        setForm({ name: "", email: "", businessName: "", message: "" });
      } else {
        showToast(data.message || "Failed to submit inquiry.", "error");
      }
    } catch (err) {
      showToast("Network error. Please try again.", "error");
    }
    setSubmitting(false);
  };

  return (
    <section id="sales-tax-inquiry" className="py-24 bg-background-light">
      <div className="mx-auto max-w-[1400px] w-[90%] md:w-[75%]">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get a Sales Tax Consultation</h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Fill out the form below, and our certified tax specialists will review your requirements and get back to you within 24 hours.
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-white border border-premium p-8 md:p-12 rounded-[2rem] shadow-premium">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">Your Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary focus:bg-white transition-all text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  required
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary focus:bg-white transition-all text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-text-primary ml-1">Business Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Apex Traders"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary focus:bg-white transition-all text-sm"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-text-primary ml-1">Inquiry / Requirements *</label>
              <textarea
                placeholder="Describe your business model and requirements..."
                rows={4}
                required
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary focus:bg-white transition-all text-sm resize-none"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white font-bold text-lg py-4 rounded-xl mt-4 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-primary/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Submitting Inquiry..." : "Submit Inquiry"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
