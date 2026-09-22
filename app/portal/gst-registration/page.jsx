"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function GstRegistrationPage() {
  const [applicantType, setApplicantType] = useState("individual");
  const [ntnNumber, setNtnNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [electricityConsumerNo, setElectricityConsumerNo] = useState("");
  const [gasConsumerNo, setGasConsumerNo] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  const [cnicFront, setCnicFront] = useState("");
  const [cnicBack, setCnicBack] = useState("");
  const [bankCertificate, setBankCertificate] = useState("");
  const [utilityBill, setUtilityBill] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  const [pricing, setPricing] = useState({ total_fee: 7500 });
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  useEffect(() => {
    fetch("/api/service-pricing?key=gst-registration")
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
    if (!ntnNumber.trim() || !businessName.trim() || !paymentProof) {
      alert("Please provide your NTN number, business name, and payment proof.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/service-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: "gst-registration",
          category: applicantType,
          cnic_front_url: cnicFront,
          cnic_back_url: cnicBack,
          payment_method: paymentMethod,
          payment_proof_url: paymentProof,
          amount: pricing.total_fee || 7500,
          extra_data: {
            applicantType,
            ntnNumber,
            businessName,
            bankIban,
            electricityConsumerNo,
            gasConsumerNo,
            businessAddress,
            bankCertificate,
            utilityBill
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
            <h1 className="text-2xl font-heading font-bold text-text-primary">FBR Sales Tax (GST) Registration</h1>
            <p className="text-text-secondary text-sm mt-1">General Sales Tax & STRN registration with Federal Board of Revenue.</p>
          </div>
          <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs">
            PKR {(pricing.total_fee || 7500).toLocaleString()}
          </span>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-5 anim-fade-in">
          <h2 className="font-bold text-lg text-text-primary">Step 1: Business & Utility Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Registration Category</label>
              <select
                value={applicantType}
                onChange={e => setApplicantType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="individual">Individual / Sole Proprietor</option>
                <option value="aop">Partnership / AOP</option>
                <option value="company">Private Limited Company</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Existing NTN Number</label>
              <input
                type="text"
                placeholder="7-digit NTN (e.g. 1234567-8)"
                value={ntnNumber}
                onChange={e => setNtnNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Business Trading Name</label>
              <input
                type="text"
                placeholder="Registered business title"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Business Bank Account IBAN</label>
              <input
                type="text"
                placeholder="PKXX..."
                value={bankIban}
                onChange={e => setBankIban(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Commercial Electricity Meter Consumer No.</label>
              <input
                type="text"
                placeholder="Consumer number on business premises bill"
                value={electricityConsumerNo}
                onChange={e => setElectricityConsumerNo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Gas Consumer No. (Optional)</label>
              <input
                type="text"
                placeholder="Gas meter reference"
                value={gasConsumerNo}
                onChange={e => setGasConsumerNo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Business Premises Address</label>
            <textarea
              rows={2}
              placeholder="Commercial address where business operates..."
              value={businessAddress}
              onChange={e => setBusinessAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!ntnNumber.trim() || !businessName.trim()}
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
              <p className="text-xs font-bold text-gray-700 mb-2">CNIC Front & Back</p>
              {cnicFront ? <p className="text-green-600 font-bold text-xs">✓ Uploaded</p> : <input type="file" onChange={e => handleFileUpload(e, setCnicFront)} className="text-xs" />}
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-gray-700 mb-2">Bank Maintenance Certificate</p>
              {bankCertificate ? <p className="text-green-600 font-bold text-xs">✓ Uploaded</p> : <input type="file" onChange={e => handleFileUpload(e, setBankCertificate)} className="text-xs" />}
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-gray-700 mb-2">Latest Electricity Utility Bill of Business Premises</p>
            {utilityBill ? <p className="text-green-600 font-bold text-xs">✓ Uploaded</p> : <input type="file" onChange={e => handleFileUpload(e, setUtilityBill)} className="text-xs" />}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Select Payment Account (Fee: PKR {(pricing.total_fee || 7500).toLocaleString()})</label>
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
              {submitting ? "Submitting..." : "Submit GST Application"}
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
          <h2 className="text-2xl font-bold text-text-primary mb-2">Sales Tax (GST) Registration Submitted!</h2>
          <p className="text-text-secondary text-sm mb-1">Our sales tax specialists will file your STRN registration with FBR.</p>
          <p className="text-xs font-mono font-bold text-primary mb-6">Application ID: #{submittedId}</p>
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
