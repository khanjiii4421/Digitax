"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

const DEFAULT_SECTIONS = [
  { id: "hero", label: "Hero Banner", icon: "🏠" },
  { id: "calculator", label: "Tax Calculator", icon: "🧮" },
  { id: "partners", label: "Partners", icon: "🤝" },
  { id: "about", label: "About Section", icon: "ℹ️" },
  { id: "products", label: "Popular Products", icon: "📦" },
  { id: "services", label: "Business Services", icon: "⚡" },
  { id: "testimonials", label: "Testimonials", icon: "💬" },
  { id: "team", label: "Meet Our Team", icon: "👥" },
  { id: "videos", label: "Featured Videos", icon: "🎬" },
  { id: "queries", label: "Contact / Query Form", icon: "📝" },
];

export default function DynamicSectionsTab() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        const map = {};
        data.forEach(item => { map[item.key] = item.value; });
        const orderStr = map.dynamic_section_order || "hero,calculator,partners,about,products,services,testimonials,team,videos,queries";
        const orderArr = orderStr.split(",").map(s => s.trim()).filter(Boolean);
        
        // Build ordered list, then append any missing defaults
        const ordered = [];
        orderArr.forEach(id => {
          const found = DEFAULT_SECTIONS.find(s => s.id === id);
          if (found) ordered.push(found);
        });
        DEFAULT_SECTIONS.forEach(s => {
          if (!ordered.find(o => o.id === s.id)) ordered.push(s);
        });
        
        setSections(ordered);
        setLoading(false);
      })
      .catch(() => {
        showToast("Failed to load section order.", "error");
        setSections([...DEFAULT_SECTIONS]);
        setLoading(false);
      });
  }, []);

  const handleMove = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setSections(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    const orderStr = sections.map(s => s.id).join(",");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dynamic_section_order: orderStr }),
      });
      if (res.ok) {
        showToast("Section order saved!", "success");
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
        <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Dynamic Section Order</h2>
        <p className="text-text-secondary text-sm mt-1">Drag sections up/down to reorder them on the homepage. Changes are saved when you click Save.</p>
      </div>

      <div className="bg-white rounded-[20px] border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Homepage Section Order</span>
        </div>
        <div className="divide-y divide-gray-100">
          {sections.map((section, idx) => (
            <div key={section.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
              <span className="text-lg w-8 text-center select-none">{section.icon}</span>
              <span className="font-bold text-text-primary text-sm flex-1">{section.label}</span>
              <span className="text-xs text-text-secondary bg-gray-100 px-2.5 py-1 rounded-full font-mono">{idx + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, "up")}
                  className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-20 cursor-pointer transition-colors"
                  title="Move Up"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </button>
                <button
                  disabled={idx === sections.length - 1}
                  onClick={() => handleMove(idx, "down")}
                  className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-20 cursor-pointer transition-colors"
                  title="Move Down"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer text-sm shadow-md"
        >
          {saving ? "Saving..." : "Save Section Order"}
        </button>
      </div>
    </div>
  );
}
