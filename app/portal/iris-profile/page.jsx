"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const IRIS_UPDATE_TYPES = [
  { id: "mobile_email", title: "Mobile / Email Update", desc: "Update your registered phone number or primary email address in FBR IRIS." },
  { id: "business_address", title: "Business / Branch Address", desc: "Add or modify commercial business premises or utility meter reference." },
  { id: "bank_account", title: "Bank Account Addition", desc: "Add or update business / personal IBAN and bank maintenance records." },
  { id: "legal_representative", title: "Legal Representative / Advocate", desc: "Appoint or revoke authorization for a tax consultant or attorney." },
  { id: "business_activity", title: "Principal Business Activity / Sector", desc: "Update or add manufacturing, retail, services, or export activity codes." },
];

export default function IrisProfilePage() {
  const [selectedType, setSelectedType] = useState("mobile_email");
  const [fbrRegistrationNo, setFbrRegistrationNo] = useState("");
  const [details, setDetails] = useState("");
  const [cnicFront, setCnicFront] = useState("");
  const [cnicBack, setCnicBack] = useState("");
  const [proofDoc, setProofDoc] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  const [pricing, setPricing] = useState({ total_fee: 2000 });
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  useEffect(() => {
    fetch("/api/service-pricing?key=iris-profile")
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
    if (!fbrRegistrationNo.trim() || !paymentProof) {
      alert("Please provide your CNIC/NTN and upload payment proof.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/service-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: "iris-profile",
          category: selectedType,
          cnic_front_url: cnicFront,
          cnic_back_url: cnicBack,
          payment_method: paymentMethod,
          payment_proof_url: paymentProof,
          amount: pricing.total_fee || 2000,
          extra_data: {
            selectedType,
            fbrRegistrationNo,
            details,
            proofDoc
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
            <h1 className="text-2xl font-heading font-bold text-text-primary">FBR IRIS Profile Modification</h1>
            <p className="text-text-secondary text-sm mt-1">Form 181 modification for phone, email, business address, and banking updates.</p>
          </div>
          <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs">
            PKR {(pricing.total_fee || 2000).toLocaleString()}
          </span>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-5 anim-fade-in">
          <h2 className="font-bold text-lg text-text-primary">Select Modification Category</h2>

          <div className="grid grid-cols-1 gap-3">
            {IRIS_UPDATE_TYPES.map(type => (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  selectedType === type.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  selectedType === type.id ? 'border-primary bg-primary text-white' : 'border-gray-300'
                }`}>
                  {selectedType === type.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{type.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">CNIC / NTN Number</label>
              <input
                type="text"
                placeholder="33202-XXXXXXX-X"
                value={fbrRegistrationNo}
                onChange={e => setFbrRegistrationNo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Details of Change (e.g. New Mobile / Address / IBAN)</label>
              <textarea
                rows={3}
                placeholder="Describe the exact new details to be updated in your FBR profile..."
                value={details}
                onChange={e => setDetails(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!fbrRegistrationNo.trim()}
            className="self-end bg-primary text-white font-bold px-8 py-3 rounded-xl text-sm shadow-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            Continue to Documents & Payment →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-5 anim-fade-in">
          <h2 className="font-bold text-lg text-text-primary">Step 2: Upload Documents & Payment</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-gray-700 mb-2">CNIC Front Copy</p>
              {cnicFront ? <p className="text-green-600 font-bold text-xs">✓ Uploaded</p> : <input type="file" onChange={e => handleFileUpload(e, setCnicFront)} className="text-xs" />}
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-gray-700 mb-2">Supporting Proof (Bill / SIM proof / Letter)</p>
              {proofDoc ? <p className="text-green-600 font-bold text-xs">✓ Uploaded</p> : <input type="file" onChange={e => handleFileUpload(e, setProofDoc)} className="text-xs" />}
            </div>
          </div>

          {/* Payment Account */}
          <div className="mt-2">
            <label className="block text-xs font-bold text-gray-700 mb-2">Pay Fee (PKR {(pricing.total_fee || 2000).toLocaleString()}) to DigiTax</label>
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
              {submitting ? "Submitting..." : "Submit Application"}
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
          <h2 className="text-2xl font-bold text-text-primary mb-2">IRIS Modification Request Submitted!</h2>
          <p className="text-text-secondary text-sm mb-1">Our FBR-certified team will process Form 181 in IRIS.</p>
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
