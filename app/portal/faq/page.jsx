"use client";

import { useState, useEffect } from "react";

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetch("/api/faqs")
      .then(r => r.json())
      .then(d => {
        if (d.success) setFaqs(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = ["all", ...new Set(faqs.map(f => f.category).filter(Boolean))];

  const filteredFaqs = faqs.filter(f => {
    const matchesCat = selectedCat === "all" || f.category === selectedCat;
    const matchesSearch = !search.trim() ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20 anim-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 text-center">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">Frequently Asked Questions</h1>
        <p className="text-text-secondary text-sm mt-1 max-w-xl mx-auto">
          Find answers to common questions about Pakistan tax filing, FBR active taxpayer status, NTN registration, and corporate services.
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto mt-6 relative">
          <input
            type="text"
            placeholder="Search questions (e.g. NTN, Filer, IRIS)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                selectedCat === cat ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No matching questions found.
            </div>
          ) : (
            filteredFaqs.map(faq => (
              <div key={faq.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-sm text-gray-900">{faq.question}</span>
                  <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openId === faq.id ? 'rotate-180 text-primary' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openId === faq.id && (
                  <div className="px-5 pb-5 pt-1 text-sm text-gray-600 border-t border-gray-50 leading-relaxed anim-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
