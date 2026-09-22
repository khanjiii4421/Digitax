"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import PreFooterContactBar from "./PreFooterContactBar";

export default function Footer({ settings = [] }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [logoError, setLogoError] = useState(false);
  
  const title = settings.find(s => s.key === "site_title")?.value || "DIGITAX";
  const slogan = settings.find(s => s.key === "site_slogan")?.value || "File Your Taxes In Just 6 Minutes With Our Qualified Consultants!";
  const logoUrl = settings.find(s => s.key === "site_logo")?.value;
  const copyright = settings.find(s => s.key === "footer_copyright")?.value || "© 2018–2026 Digitax (Pvt) Limited";
  const poweredBy = settings.find(s => s.key === "footer_powered_by")?.value || "Powered by Arittek";
  const phone = settings.find(s => s.key === "contact_phone")?.value || "+92 300 1234567";
  const contactEmail = settings.find(s => s.key === "contact_email")?.value || "info@digitax.pk";
  const whatsapp = settings.find(s => s.key === "contact_whatsapp")?.value || "+92 300 1234567";
  
  const fb = settings.find(s => s.key === "social_facebook")?.value || "#";
  const tw = settings.find(s => s.key === "social_twitter")?.value || "#";
  const li = settings.find(s => s.key === "social_linkedin")?.value || "#";
  const ig = settings.find(s => s.key === "social_instagram")?.value || "#";

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    showToast("Thank you for subscribing to our newsletter!", "success");
    setEmail("");
  };

  return (
    <div className="w-full mt-16 md:mt-24">
      <PreFooterContactBar settings={settings} />
      <footer className="bg-gray-900 text-white relative overflow-hidden pt-16 md:pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,86,168,0.15),transparent_40%)]"></div>
      
      <div className="max-w-[1400px] w-[92%] md:w-[85%] mx-auto relative z-10">
        {/* Top Section - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 pb-12 md:pb-16">
          
          {/* Brand Column */}
          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = "/"}>
              {logoUrl && !logoError ? (
                <img src={logoUrl} alt={title} className="h-10 object-contain" onError={() => setLogoError(true)} />
              ) : (
                <>
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0">D</div>
                  <span className="font-heading font-bold text-2xl text-white tracking-tight">{title}</span>
                </>
              )}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{slogan}</p>
            <div className="flex items-center gap-3 mt-1">
              <a href={fb} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
              </a>
              <a href={tw} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href={li} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href={ig} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
 
          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-heading font-bold text-base text-white">Quick Links</h4>
            <nav className="flex flex-col gap-2.5 text-sm text-gray-400">
              <a href="/" className="hover:text-primary transition-colors">Home</a>
              <a href="/services" className="hover:text-primary transition-colors">Business Services</a>
              <a href="/tools/salary-tax-calculator" className="hover:text-primary transition-colors">Tax Calculator</a>
              <a href="/sales-tax" className="hover:text-primary transition-colors">Sales Tax</a>
            </nav>
          </div>
 
          {/* Contact Info */}
          <div className="flex flex-col gap-4 text-sm text-gray-400">
            <h4 className="font-heading font-bold text-base text-white">Contact Info</h4>
            <div className="flex flex-col gap-2.5">
              <p className="flex items-start gap-2">
                <span className="shrink-0">Phone:</span>
                <a href={`tel:${phone}`} className="hover:text-primary transition-colors break-all">{phone}</a>
              </p>
              <p className="flex items-start gap-2">
                <span className="shrink-0">WhatsApp:</span>
                <a href={`https://wa.me/${whatsapp.replace(/\+/g, "").replace(/\s/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors break-all">{whatsapp}</a>
              </p>
              <p className="flex items-start gap-2">
                <span className="shrink-0">Email:</span>
                <a href={`mailto:${contactEmail}`} className="hover:text-primary transition-colors break-all">{contactEmail}</a>
              </p>
            </div>
          </div>
 
          {/* Newsletter */}
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
            <h4 className="font-heading font-bold text-base text-white">Newsletter</h4>
            <p className="text-sm text-gray-400 leading-relaxed">Subscribe to get latest tax slabs and news updates.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row lg:flex-col gap-2 mt-1 w-full">
              <input type="email" placeholder="Your Email" required className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:border-primary focus:bg-white/10 transition-all text-white" value={email} onChange={e => setEmail(e.target.value)} />
              <button type="submit" className="bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/95 transition-colors cursor-pointer shrink-0 whitespace-nowrap">Subscribe</button>
            </form>
          </div>
        </div>
      </div>
 
      {/* Bottom Bar */}
      <div className="bg-white/5 backdrop-blur-md border-t border-white/10 py-5 relative z-10">
        <div className="max-w-[1400px] w-[92%] md:w-[85%] mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-400 text-center md:text-left">
          <p>{copyright} | {poweredBy}</p>
          <div className="flex gap-4 md:gap-6 flex-wrap justify-center">
            <a href="/terms" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Statement</a>
          </div>
        </div>
      </div>
    </footer>
    </div>
  );
}
