"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

const PAGE_KEYS = [
  { key: "coming_soon_calculator", label: "Tax Calculator", description: "Income tax calculator tool" },
  { key: "coming_soon_sales_tax", label: "Sales Tax Filing", description: "Sales tax computation & filing" },
  { key: "coming_soon_services", label: "Services", description: "Business services directory" },
  { key: "coming_soon_about", label: "About Section", description: "About your company" },
  { key: "coming_soon_testimonials", label: "Testimonials", description: "Client reviews & testimonials" },
  { key: "coming_soon_videos", label: "Featured Videos", description: "YouTube video showcase" },
];

export default function ComingSoonTab() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        const map = {};
        data.forEach(item => { map[item.key] = item.value; });
        const pageStatuses = {};
        PAGE_KEYS.forEach(p => {
          pageStatuses[p.key] = map[p.key] || "active";
        });
        setStatuses(pageStatuses);
        setLoading(false);
      })
      .catch(() => {
        showToast("Failed to load settings.", "error");
        setLoading(false);
      });
  }, []);

  const handleToggle = (key) => {
    setStatuses(prev => ({
      ...prev,
      [key]: prev[key] === "active" ? "coming_soon" : "active"
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statuses),
      });
      if (res.ok) {
        showToast("Page statuses saved!", "success");
      } else {
        showToast("Failed to save.", "error");
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
        <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Coming Soon / Page Visibility</h2>
        <p className="text-text-secondary text-sm mt-1">Toggle individual sections on or off across the public website.</p>
      </div>

      <div className="bg-white rounded-[20px] p-6 border border-gray-200/60 shadow-sm flex flex-col gap-0 divide-y divide-gray-100">
        {PAGE_KEYS.map(page => (
          <div key={page.key} className="flex items-center justify-between py-4 px-2">
            <div>
              <p className="font-bold text-text-primary text-sm">{page.label}</p>
              <p className="text-text-secondary text-xs mt-0.5">{page.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                statuses[page.key] === "active" 
                  ? "bg-success/10 text-success" 
                  : "bg-warning/10 text-warning"
              }`}>
                {statuses[page.key] === "active" ? "Active" : "Coming Soon"}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={statuses[page.key] === "active"}
                  onChange={() => handleToggle(page.key)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer text-sm shadow-md"
        >
          {saving ? "Saving..." : "Save Page Statuses"}
        </button>
      </div>
    </div>
  );
}
