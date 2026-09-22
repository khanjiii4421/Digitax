"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const BUSINESS_TYPES = [
  { id: "sole_proprietor", title: "Sole Proprietorship", desc: "Single owner registered business under individual NTN with FBR business certificate." },
  { id: "aop_partnership", title: "Partnership / AOP Firm", desc: "Form C registration with Registrar of Firms under Partnership Act 1932." },
  { id: "private_limited", title: "Private Limited Company (Pvt Ltd)", desc: "Incorporation with SECP under Companies Act 2017 with Digital Signature & Certified MOA/AOA." },
  { id: "single_member", title: "Single Member Company (SMC-Pvt Ltd)", desc: "Corporate limited liability company owned by a single individual under SECP." },
  { id: "llp", title: "Limited Liability Partnership (LLP)", desc: "Hybrid corporate legal structure registered with SECP." }
];

export default function BusinessRegistrationPage() {
  const [businessType, setBusinessType] = useState("sole_proprietor");
  const [businessName, setBusinessName] = useState("");
  const [natureOfBusiness, setNatureOfBusiness] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [city, setCity] = useState("Islamabad");
  const [partnersCount, setPartnersCount] = useState("1");
  const [capital, setCapital] = useState("100000");

  const [cnicFront, setCnicFront] = useState("");
  const [cnicBack, setCnicBack] = useState("");
  const [rentDeed, setRentDeed] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  const [pricing, setPricing] = useState({ government_fee: 2000, digitax_fee: 8000, total_fee: 10000 });
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  useEffect(() => {
    fetch("/api/service-pricing?key=business-registration")
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setPricing(d.data); })
      .catch(() => {});

    fetch("/api/admin/payment-methods")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const active = (d.methods || []).filter(m => m.is_active);
          setPaymentMethods(active);
          if (active.length > 0) setPaymentMethod(active[0].name);
        }
      })
      .catch(() => {});
  }, []);

  const handleFileUpload = async (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "applications");
    try {
      const res = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.fileUrl) setter(data.fileUrl);
    } catch(err) {
      alert("Upload failed.");
    }
  };

  const handleSubmit = async () => {
    if (!businessName.trim() || !paymentProof) {
      alert("Please provide the business name and upload payment proof.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/service-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: "business-registration",
          category: businessType,
          cnic_front_url: cnicFront,
          cnic_back_url: cnicBack,
          payment_method: paymentMethod,
          payment_proof_url: paymentProof,
          amount: pricing.total_fee || 10000,
          extra_data: {
            businessType,
            businessName,
            natureOfBusiness,
            businessAddress,
            city,
            partnersCount,
            capital,
            rentDeed
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmittedId(data.id);
        setStep(3);
      } else {
        alert(data.error || "Submission failed.");
      }
    } catch(e) {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-20 anim-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">Business & Company Registration</h1>
            <p className="text-text-secondary text-sm mt-1">SECP Private Limited, Sole Proprietor, Partnership Firm & LLP Formation in Pakistan.</p>
          </div>
          <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs">
            PKR {(pricing.total_fee || 10000).toLocaleString()}
          </span>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-5 anim-fade-in">
          <h2 className="font-bold text-lg text-text-primary">Step 1: Choose Legal Business Structure</h2>

          <div className="grid grid-cols-1 gap-3">
            {BUSINESS_TYPES.map(type => (
              <div
                key={type.id}
                onClick={() => setBusinessType(type.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  businessType === type.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  businessType === type.id ? 'border-primary bg-primary text-white' : 'border-gray-300'
                }`}>
                  {businessType === type.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{type.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Proposed Business / Company Name</label>
              <input
                type="text"
                placeholder="e.g. Apex Tech Solutions (Pvt) Ltd"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nature / Sector of Business</label>
              <input
                type="text"
                placeholder="e.g. Software & IT Services, General Trading"
                value={natureOfBusiness}
                onChange={e => setNatureOfBusiness(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Registered City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Directors / Partners Count</label>
              <input
                type="number"
                min="1"
                value={partnersCount}
                onChange={e => setPartnersCount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Authorized Capital (PKR)</label>
              <input
                type="number"
                value={capital}
                onChange={e => setCapital(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Office / Business Premises Address</label>
            <textarea
              rows={2}
              placeholder="Full address of company office..."
              value={businessAddress}
              onChange={e => setBusinessAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!businessName.trim()}
            className="self-end bg-primary text-white font-bold px-8 py-3 rounded-xl text-sm shadow-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            Continue to Documents & Payment →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-5 anim-fade-in">
          <h2 className="font-bold text-lg text-text-primary">Step 2: Upload Documents & Payment</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-gray-700 mb-2">Director CNIC Front</p>
              {cnicFront ? <p className="text-green-600 font-bold text-xs">✓ Uploaded</p> : <input type="file" onChange={e => handleFileUpload(e, setCnicFront)} className="text-xs" />}
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-gray-700 mb-2">Director CNIC Back</p>
              {cnicBack ? <p className="text-green-600 font-bold text-xs">✓ Uploaded</p> : <input type="file" onChange={e => handleFileUpload(e, setCnicBack)} className="text-xs" />}
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-gray-700 mb-2">Office Utility Bill / Rent Deed</p>
              {rentDeed ? <p className="text-green-600 font-bold text-xs">✓ Uploaded</p> : <input type="file" onChange={e => handleFileUpload(e, setRentDeed)} className="text-xs" />}
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Government Registration / SECP Fee:</span>
              <span className="font-bold text-gray-900">PKR {(pricing.government_fee || 2000).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>DigiTax Legal Preparation & Filing Fee:</span>
              <span className="font-bold text-gray-900">PKR {(pricing.digitax_fee || 8000).toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-primary">
              <span>Total Fee:</span>
              <span>PKR {(pricing.total_fee || 10000).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Select Payment Account</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paymentMethods.map(pm => (
                <div
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.name)}
                  className={`p-3 rounded-xl border-2 cursor-pointer ${
                    paymentMethod === pm.name ? 'border-primary bg-primary/5' : 'border-gray-100'
                  }`}
                >
                  <p className="font-bold text-xs text-gray-900">{pm.name}</p>
                  <p className="text-[11px] text-gray-500 font-mono">{pm.account_number}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Upload Transfer Screenshot</label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
              {paymentProof ? <p className="text-green-600 font-bold text-xs">✓ Receipt Uploaded</p> : <input type="file" onChange={e => handleFileUpload(e, setPaymentProof)} className="text-xs" />}
            </div>
          </div>

          <div className="flex justify-between items-center mt-2">
            <button onClick={() => setStep(1)} className="text-text-secondary text-sm font-bold hover:underline cursor-pointer">
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !paymentProof}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-3 rounded-xl text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Incorporation Request"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center anim-fade-in">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Incorporation Request Submitted!</h2>
          <p className="text-text-secondary text-sm mb-1">Our corporate legal team will review company name availability and prepare incorporation documents.</p>
          <p className="text-xs font-mono font-bold text-primary mb-6">Tracking ID: #{submittedId}</p>
          <div className="flex justify-center gap-4">
            <Link href="/portal/applications" className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm">
              My Applications
            </Link>
            <Link href="/portal" className="border border-gray-200 text-text-secondary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50">
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
