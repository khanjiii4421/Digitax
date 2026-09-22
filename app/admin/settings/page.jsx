"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import PartnersTab from "./PartnersTab";
import ServicesTab from "./ServicesTab";
import TaxSlabsTab from "./TaxSlabsTab";
import VideosTab from "./VideosTab";
import BlogsTab from "./BlogsTab";
import AboutTab from "./AboutTab";
import MeetOurTeamTab from "./MeetOurTeamTab";
import TestimonialsTab from "./TestimonialsTab";
import ProductsTab from "./ProductsTab";
import QueriesTab from "./QueriesTab";
import UploadSectionTab from "./UploadSectionTab";
import SEOTab from "./SEOTab";
import ComingSoonTab from "./ComingSoonTab";
import DynamicSectionsTab from "./DynamicSectionsTab";

function SiteSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("brand");
  const [logoPreview, setLogoPreview] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);
  const [uploading, setUploading] = useState({});

  const tabs = [
    { key: "brand", label: "Brand & Identity", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { key: "promo", label: "Promo Popup", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
    { key: "hero", label: "Hero Section", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
    { key: "about", label: "About", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: "team", label: "Team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { key: "testimonials", label: "Testimonials", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { key: "products", label: "Products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { key: "services", label: "Services", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { key: "partners", label: "Partners", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { key: "queries", label: "Queries", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
    { key: "uploads", label: "Uploads", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
    { key: "tax-slabs", label: "Tax Slabs", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
    { key: "videos", label: "Videos", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
    { key: "blogs", label: "Blogs", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
    { key: "contact", label: "Contact", icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
    { key: "footer", label: "Footer", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { key: "seo", label: "SEO", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { key: "coming-soon", label: "Visibility", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    { key: "dynamic-sections", label: "Layout", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
  ];

  // Sync active tab with URL query parameter ?tab=
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.some(t => t.key === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        const obj = {};
        data.forEach(item => { obj[item.key] = item.value; });
        setSettings(obj);
        if (obj.site_logo) setLogoPreview(obj.site_logo);
        if (obj.hero_image) setHeroPreview(obj.hero_image);
        setLoading(false);
      })
      .catch(() => {
        showToast("Failed to load settings.", "error");
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e, settingKey, folder, previewSetter) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return showToast("Only JPG, PNG, WebP, and GIF files are supported.", "error");
    }

    previewSetter(URL.createObjectURL(file));
    setUploading(prev => ({ ...prev, [settingKey]: true }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, [settingKey]: data.url }));
        showToast("Image uploaded successfully!", "success");
      } else {
        showToast(data.error || "Upload failed.", "error");
      }
    } catch (err) {
      showToast("Upload failed. Please try again.", "error");
    }
    setUploading(prev => ({ ...prev, [settingKey]: false }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showToast("Settings saved successfully!", "success");
      } else {
        showToast("Failed to save settings.", "error");
      }
    } catch (err) {
      showToast("Network error. Please try again.", "error");
    }
    setSaving(false);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    router.replace(`/admin/settings?tab=${key}`, { scroll: false });
  };

  const UploadField = ({ label, settingKey, folder, preview, previewSetter, hint = "Supports JPG, PNG, WebP" }) => (
    <div className="flex flex-col gap-2">
      <label className="font-bold text-sm text-text-primary">{label}</label>
      <div className="flex flex-wrap items-center gap-6">
        <div className="w-28 h-28 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            <img src={preview} alt={label} className="w-full h-full object-contain p-2" />
          ) : (
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => handleFileUpload(e, settingKey, folder, previewSetter)}
            className="text-sm text-text-secondary file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer"
          />
          <span className="text-xs text-text-secondary">{hint}</span>
          {uploading[settingKey] && <span className="text-xs text-primary font-medium animate-pulse">Uploading...</span>}
          {settings[settingKey] && !uploading[settingKey] && (
            <span className="text-xs text-success font-medium">✓ Image saved</span>
          )}
        </div>
      </div>
    </div>
  );

  const isBasicSettingsTab = ["brand", "promo", "hero", "contact", "footer", "legal"].includes(activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 anim-fade-in w-full max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Site Settings</h1>
          <p className="text-text-secondary text-sm mt-1">All changes take effect live on your public website.</p>
        </div>
        {isBasicSettingsTab && (
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        )}
      </div>

      <div className="bg-gray-50 pt-2 pb-0 mb-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'border-primary text-primary bg-white rounded-t-xl'
                  : 'border-transparent text-text-secondary hover:text-primary hover:border-primary/30'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === "promo" && (
          <div className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm flex flex-col gap-8 anim-slide-up">
            <div>
              <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Promotional Discount Popup Banner</h2>
              <p className="text-xs text-text-secondary mt-1">Manage the eye-catching promotional discount popup shown to website visitors.</p>
            </div>

            <div className="flex flex-col gap-6">
              {/* Enable / Disable */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <h4 className="font-bold text-sm text-text-primary">Popup Status</h4>
                  <p className="text-xs text-text-secondary">Enable or disable the promotional discount popup on the homepage</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="radio"
                      name="promo_popup_enabled"
                      value="1"
                      checked={settings.promo_popup_enabled === '1' || !settings.promo_popup_enabled}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    Enabled (Active)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-secondary">
                    <input
                      type="radio"
                      name="promo_popup_enabled"
                      value="0"
                      checked={settings.promo_popup_enabled === '0'}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    Disabled
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">Offer Badge Text</label>
                  <input
                    type="text"
                    name="promo_popup_badge"
                    value={settings.promo_popup_badge || ''}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm"
                    placeholder="e.g. Special Limited Offer"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">Discount Display Tag</label>
                  <input
                    type="text"
                    name="promo_popup_discount"
                    value={settings.promo_popup_discount || ''}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm"
                    placeholder="e.g. 30% OFF"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-bold text-sm text-text-primary">Headline Title</label>
                  <input
                    type="text"
                    name="promo_popup_title"
                    value={settings.promo_popup_title || ''}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm"
                    placeholder="e.g. Get 30% OFF On Tax Filing Services!"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-bold text-sm text-text-primary">Description / Subtitle</label>
                  <textarea
                    rows={3}
                    name="promo_popup_description"
                    value={settings.promo_popup_description || ''}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm resize-none"
                    placeholder="Provide promotional details..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">Promo Coupon Code</label>
                  <input
                    type="text"
                    name="promo_popup_coupon_code"
                    value={settings.promo_popup_coupon_code || ''}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm uppercase font-mono font-bold"
                    placeholder="e.g. SAVE30"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">Target Service Link</label>
                  <select
                    name="promo_popup_service_url"
                    value={settings.promo_popup_service_url || '/portal/personal-tax'}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm cursor-pointer"
                  >
                    <option value="/portal/personal-tax">Individual / Personal Tax Filing (/portal/personal-tax)</option>
                    <option value="/portal/family-tax">Family Tax Filing (/portal/family-tax)</option>
                    <option value="/portal/ntn-registration">NTN Registration (/portal/ntn-registration)</option>
                    <option value="/portal/business-registration">Business Registration (/portal/business-registration)</option>
                    <option value="/portal/gst-registration">GST Registration (/portal/gst-registration)</option>
                    <option value="/portal/iris-profile">IRIS Profile Update (/portal/iris-profile)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-bold text-sm text-text-primary">CTA Button Text</label>
                  <input
                    type="text"
                    name="promo_popup_button_text"
                    value={settings.promo_popup_button_text || ''}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm"
                    placeholder="e.g. Claim 30% Discount Now"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "brand" && (
          <div className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm flex flex-col gap-8 anim-slide-up">
            <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Brand & Identity</h2>

            <UploadField
              label="Site Logo"
              settingKey="site_logo"
              folder="logo"
              preview={logoPreview}
              previewSetter={setLogoPreview}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-text-primary">Site Title</label>
                <input type="text" name="site_title" value={settings.site_title || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-text-primary">Site Tagline / Slogan</label>
                <input type="text" name="site_slogan" value={settings.site_slogan || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-bold text-sm text-text-primary">Meta Description (SEO)</label>
                <textarea name="meta_description" value={settings.meta_description || ''} onChange={handleChange} rows={3} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full resize-none" placeholder="Short description for search engines..." />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-bold text-sm text-text-primary">Google OAuth Client ID <span className="text-text-secondary font-normal">(for Google Sign-In button on login page)</span></label>
                <input type="text" name="google_client_id" value={settings.google_client_id || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full font-mono text-sm" placeholder="e.g. 1234567890-abcdefg.apps.googleusercontent.com" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "hero" && (
          <div className="flex flex-col gap-6">
            {/* Announcement Bar Settings */}
            <div className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm flex flex-col gap-6 anim-slide-up">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold">Announcement Bar</h2>
                  <p className="text-text-secondary text-xs mt-1">Sticky bar at the top of the homepage. Visible on all devices.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-text-primary">{settings.announcement_enabled === "1" ? "Visible" : "Hidden"}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.announcement_enabled === "1"}
                      onChange={e => setSettings({...settings, announcement_enabled: e.target.checked ? "1" : "0"})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">Announcement Text</label>
                  <input type="text" name="announcement_text" value={settings.announcement_text || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="e.g. Tax filing deadline extended to Dec 31!" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">Link URL (Optional)</label>
                  <input type="text" name="announcement_link" value={settings.announcement_link || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="https://... or /page" />
                </div>
              </div>
            </div>

            {/* Hero Section Settings */}
            <div className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm flex flex-col gap-8 anim-slide-up">
              <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Hero Section</h2>

            <UploadField
              label="Hero Background Image"
              settingKey="hero_image"
              folder="hero"
              preview={heroPreview}
              previewSetter={setHeroPreview}
              hint="Recommended: 1200×800px, JPG or PNG"
            />

            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-text-primary">Hero Heading / Slogan</label>
                <input type="text" name="site_slogan" value={settings.site_slogan || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-text-primary">Hero Description</label>
                <textarea name="hero_description" value={settings.hero_description || ''} onChange={handleChange} rows={4} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full resize-none" placeholder="A short description that appears below the heading..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">CTA Button Text</label>
                  <input type="text" name="hero_cta_text" value={settings.hero_cta_text || 'File Now'} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">CTA Button Link</label>
                  <input type="text" name="hero_cta_link" value={settings.hero_cta_link || '/portal'} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" />
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm flex flex-col gap-8 anim-slide-up">
            <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Contact & Social Media</h2>

            <div>
              <h3 className="font-bold text-sm text-text-secondary uppercase tracking-widest mb-4">Contact Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">General Phone Number</label>
                  <input type="text" name="contact_phone" value={settings.contact_phone || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="+92 300 1234567" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">WhatsApp Number</label>
                  <input type="text" name="contact_whatsapp" value={settings.contact_whatsapp || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="+92 300 1234567" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">Support Phone (Header Top Bar)</label>
                  <input type="text" name="support_phone" value={settings.support_phone || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="+92 349 1887803" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">NTN / Tax Filing Phone (Header Top Bar)</label>
                  <input type="text" name="ntn_phone" value={settings.ntn_phone || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="+92 349 1887803" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">USA LLC & ITIN Phone (Header Top Bar)</label>
                  <input type="text" name="usa_phone" value={settings.usa_phone || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="+1 (302) 555-0199" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-sm text-text-primary">Display Email (Header & Footer)</label>
                  <input type="email" name="contact_email" value={settings.contact_email || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="info@digitax.pk" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-bold text-sm text-text-primary">Admin Email (Receives Contact Queries)</label>
                  <input type="email" name="admin_email" value={settings.admin_email || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="admin@digitax.pk" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-bold text-sm text-text-primary">Office Address (Header Bar)</label>
                  <input type="text" name="office_address" value={settings.office_address || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="Office 12, 3rd Floor, Executive Plaza, Islamabad, Pakistan" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-bold text-sm text-text-primary">Contact Address</label>
                  <input type="text" name="contact_address" value={settings.contact_address || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="Office Address, City, Country" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-bold text-sm text-text-primary">Google Maps Link <span className="text-text-secondary font-normal">(leave empty to auto-generate from address)</span></label>
                  <input type="url" name="google_maps_link" value={settings.google_maps_link || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="https://www.google.com/maps/..." />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm text-text-secondary uppercase tracking-widest mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'social_facebook', label: 'Facebook URL' },
                  { key: 'social_twitter', label: 'Twitter / X URL' },
                  { key: 'social_linkedin', label: 'LinkedIn URL' },
                  { key: 'social_instagram', label: 'Instagram URL' },
                  { key: 'social_youtube', label: 'YouTube Channel URL' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="font-bold text-sm text-text-primary">{label}</label>
                    <input type="url" name={key} value={settings[key] || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" placeholder="https://..." />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "footer" && (
          <div className="bg-white rounded-[20px] p-8 border border-gray-200/60 shadow-sm flex flex-col gap-6 anim-slide-up">
            <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Footer Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-text-primary">Copyright Text</label>
                <input type="text" name="footer_copyright" value={settings.footer_copyright || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-text-primary">Powered By Text</label>
                <input type="text" name="footer_powered_by" value={settings.footer_powered_by || ''} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full" />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-bold text-sm text-text-primary">Footer Description / Tagline</label>
                <textarea name="footer_description" value={settings.footer_description || ''} onChange={handleChange} rows={3} className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors w-full resize-none" placeholder="Short message displayed in the footer..." />
              </div>
            </div>
          </div>
        )}

        {activeTab === "about" && <AboutTab />}
        {activeTab === "team" && <MeetOurTeamTab />}
        {activeTab === "testimonials" && <TestimonialsTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "queries" && <QueriesTab />}
        {activeTab === "uploads" && <UploadSectionTab />}
        {activeTab === "partners" && <PartnersTab />}
        {activeTab === "services" && <ServicesTab />}
        {activeTab === "tax-slabs" && <TaxSlabsTab />}
        {activeTab === "videos" && <VideosTab />}
        {activeTab === "blogs" && <BlogsTab />}
        
        {activeTab === "seo" && <SEOTab />}
        {activeTab === "coming-soon" && <ComingSoonTab />}
        {activeTab === "dynamic-sections" && <DynamicSectionsTab />}
      </div>

      {isBasicSettingsTab && (
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-lg shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SiteSettings() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SiteSettingsContent />
    </Suspense>
  );
}
