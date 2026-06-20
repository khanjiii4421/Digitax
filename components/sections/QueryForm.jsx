"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function QueryForm() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      return showToast("Please fill in all fields.", "error");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Query submitted successfully!", "success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        showToast(data.message || "Failed to submit query.", "error");
      }
    } catch (err) {
      showToast("Network error. Please try again.", "error");
    }
    setSubmitting(false);
  };

  return (
    <section id="contact" className="mx-auto max-w-[1400px] w-[90%] md:w-[75%] py-24">
      <div className="text-center mb-16">
        <h2 className="text-section-heading font-heading font-bold text-text-primary tracking-tight">Have Any Questions?</h2>
        <p className="text-text-secondary mt-2 max-w-lg mx-auto text-body-custom">Drop us a line and our qualified tax consultants will get back to you shortly.</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-xl border border-gray-200/50 p-8 md:p-12 rounded-[2rem] shadow-2xl anim-slide-up">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-text-primary ml-1">Your Name</label>
              <input type="text" placeholder="Khalil Ahmad" required className="bg-white/60 border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary focus:bg-white transition-all shadow-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-text-primary ml-1">Email Address</label>
              <input type="email" placeholder="user@gmail.com" required className="bg-white/60 border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary focus:bg-white transition-all shadow-sm" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-primary ml-1">Subject</label>
            <input type="text" placeholder="What Do You Want To Know?" required className="bg-white/60 border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary focus:bg-white transition-all shadow-sm" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-primary ml-1">Message</label>
            <textarea placeholder="Type your message here..." rows={4} required className="bg-white/60 border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary focus:bg-white transition-all shadow-sm resize-none" value={form.message} onChange={e => setForm({...form, message: e.target.value})}></textarea>
          </div>

          <button type="submit" disabled={submitting} className="bg-primary text-white font-bold text-lg py-4 rounded-xl mt-4 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-primary/30 transition-all disabled:opacity-50 cursor-pointer">
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
}
