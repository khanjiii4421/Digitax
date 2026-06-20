"use client";

import { useState, useRef, useEffect } from "react";

const SEARCH_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Business Services", path: "/services" },
  { label: "Tax Tool", path: "/#tax-tool" },
  { label: "Sales Tax", path: "/sales-tax" },
  { label: "Client Portal", path: "/portal" },
  { label: "Login", path: "/login" },
];

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
        setResults([]);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const filtered = SEARCH_ITEMS.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        navigateTo(results[selectedIndex].path);
      } else if (results.length > 0) {
        navigateTo(results[0].path);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      setResults([]);
    }
  };

  const navigateTo = (path) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    window.location.href = path;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search toggle button (mobile) / always visible search icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-primary/10 transition-colors cursor-pointer"
        aria-label="Search"
      >
        <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Expanded search input */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-[60] w-80 sm:w-96 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages... (e.g. Services, Tax, Login)"
                className="ml-3 w-full bg-transparent text-sm text-text-primary placeholder-text-secondary focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                  className="ml-2 text-text-secondary hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Results dropdown */}
            {results.length > 0 && (
              <div className="max-h-60 overflow-y-auto py-2">
                {results.map((item, idx) => (
                  <button
                    key={item.path}
                    onClick={() => navigateTo(item.path)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors cursor-pointer ${
                      selectedIndex === idx
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-text-primary hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {query.trim() && results.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-text-secondary">
                No pages found for &ldquo;{query}&rdquo;
              </div>
            )}

            {/* Quick links when no query */}
            {!query && (
              <div className="py-2">
                <div className="px-4 py-1.5">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Quick Links</span>
                </div>
                {SEARCH_ITEMS.map((item, idx) => (
                  <button
                    key={item.path}
                    onClick={() => navigateTo(item.path)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors cursor-pointer ${
                      selectedIndex === idx
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-text-primary hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
