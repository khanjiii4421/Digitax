"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PersonalTaxFilingPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [taxYear, setTaxYear] = useState("2025");
  const [employmentType, setEmploymentType] = useState("salaried");
  const [annualSalary, setAnnualSalary] = useState("");
  const [otherIncome, setOtherIncome] = useState("");
  const [taxDeducted, setTaxDeducted] = useState("");
  const [cnicFront, setCnicFront] = useState("");
  const [cnicBack, setCnicBack] = useState("");
  const [salaryCertificate, setSalaryCertificate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  const [pricing, setPricing] = useState({ government_fee: 0, digitax_fee: 2500, total_fee: 2500 });
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalFee, setFinalFee] = useState(2500);
  const [couponMsg, setCouponMsg] = useState({ text: "", error: false });
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  useEffect(() => {
    const urlCoupon = searchParams.get("coupon");
    if (urlCoupon) {
      setCouponCode(urlCoupon.toUpperCase());
    }

    fetch("/api/service-pricing?key=personal-tax")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const fee = parseFloat(d.data.total_fee) || 2500;
          setPricing(d.data);
          setFinalFee(fee);

          if (urlCoupon) {
            // Auto validate coupon with loaded fee
            fetch("/api/coupons/validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: urlCoupon, amount: fee })
            })
              .then(res => res.json())
              .then(cData => {
                if (cData.success) {
                  setCouponApplied(true);
                  setDiscountAmount(cData.discountAmount);
                  setFinalFee(cData.finalAmount);
                  setCouponMsg({ text: `Special Offer Applied! Saved PKR ${cData.discountAmount}`, error: false });
                }
              })
              .catch(() => {});
          }
        }
      })
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
      if (data.success && data.fileUrl) {
        setter(data.fileUrl);
      } else {
        alert("File upload failed. Please try again.");
      }
    } catch(err) {
      alert("Error uploading file.");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, amount: pricing.total_fee || 2500 })
      });
      const data = await res.json();
      if (data.success) {
        setCouponApplied(true);
        setDiscountAmount(data.discountAmount);
        setFinalFee(data.finalAmount);
        setCouponMsg({ text: `Coupon applied! You saved PKR ${data.discountAmount}`, error: false });
      } else {
        setCouponMsg({ text: data.error || "Invalid coupon", error: true });
        setCouponApplied(false);
      }
    } catch (e) {
      setCouponMsg({ text: "Failed to validate coupon.", error: true });
    }
  };

  const handleSubmit = async () => {
    if (!paymentMethod || !paymentProof) {
      alert("Please select a payment method and upload payment proof.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/service-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: "personal-tax",
          category: employmentType,
          cnic_front_url: cnicFront,
          cnic_back_url: cnicBack,
          payment_method: paymentMethod,
          payment_proof_url: paymentProof,
          coupon_code: couponApplied ? couponCode : "",
          discount_amount: discountAmount,
          amount: finalFee,
          extra_data: {
            taxYear,
            employmentType,
            annualSalary,
            otherIncome,
            taxDeducted,
            salaryCertificate
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmittedId(data.id);
        setStep(4);
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
            <h1 className="text-2xl font-heading font-bold text-text-primary">Personal Income Tax Filing</h1>
            <p className="text-text-secondary text-sm mt-1">Individual FBR tax return filing for salaried individuals, freelancers & professionals.</p>
          </div>
          <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs">
            PKR {finalFee.toLocaleString()}
          </span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
          {["Income Info", "Documents", "Payment", "Submitted"].map((st, i) => (
            <div key={st} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i + 1 ? "bg-green-500 text-white" :
                step === i + 1 ? "bg-primary text-white ring-4 ring-primary/10" : "bg-gray-100 text-gray-400"
              }`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step === i + 1 ? "text-primary" : "text-gray-400"}`}>{st}</span>
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-5 anim-fade-in">
          <h2 className="font-bold text-lg text-text-primary">Step 1: Your Income Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tax Year</label>
              <select
                value={taxYear}
                onChange={e => setTaxYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="2025">Tax Year 2025 (July 2024 - June 2025)</option>
                <option value="2024">Tax Year 2024 (July 2023 - June 2024)</option>
                <option value="2023">Tax Year 2023</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Source of Income</label>
              <select
                value={employmentType}
                onChange={e => setEmploymentType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="salaried">Salaried Individual</option>
                <option value="freelancer">IT / Freelancer</option>
                <option value="professional">Professional / Consultant</option>
                <option value="rental">Rental Income / Property</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Estimated Annual Income (PKR)</label>
              <input
                type="number"
                placeholder="e.g. 1800000"
                value={annualSalary}
                onChange={e => setAnnualSalary(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Other Income (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={otherIncome}
                onChange={e => setOtherIncome(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tax Deducted by Employer (PKR)</label>
              <input
                type="number"
                placeholder="e.g. 60000"
                value={taxDeducted}
                onChange={e => setTaxDeducted(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="self-end bg-primary text-white font-bold px-8 py-3 rounded-xl text-sm shadow-sm hover:opacity-90 transition-all cursor-pointer mt-2"
          >
            Continue to Documents →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-5 anim-fade-in">
          <h2 className="font-bold text-lg text-text-primary">Step 2: Upload Documents</h2>
          <p className="text-xs text-text-secondary">Please upload clear photos or PDF copies of your CNIC and salary slips / tax deduction certificates.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-gray-700 mb-2">CNIC Front Copy</p>
              {cnicFront ? (
                <div className="text-green-600 font-bold text-xs">✓ Uploaded Successfully</div>
              ) : (
                <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setCnicFront)} className="text-xs" />
              )}
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-gray-700 mb-2">CNIC Back Copy</p>
              {cnicBack ? (
                <div className="text-green-600 font-bold text-xs">✓ Uploaded Successfully</div>
              ) : (
                <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setCnicBack)} className="text-xs" />
              )}
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-gray-700 mb-2">Salary Certificate / Bank Statement / Tax Deduction (Optional)</p>
            {salaryCertificate ? (
              <div className="text-green-600 font-bold text-xs">✓ Uploaded Successfully</div>
            ) : (
              <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setSalaryCertificate)} className="text-xs" />
            )}
          </div>

          <div className="flex justify-between items-center mt-2">
            <button onClick={() => setStep(1)} className="text-text-secondary text-sm font-bold hover:underline cursor-pointer">
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-primary text-white font-bold px-8 py-3 rounded-xl text-sm shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              Continue to Payment →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6 anim-fade-in">
          <h2 className="font-bold text-lg text-text-primary">Step 3: Payment & Submission</h2>

          {/* Pricing summary */}
          <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">DigiTax Service Fee:</span>
              <span className="font-bold text-gray-900">PKR {(pricing.total_fee || 2500).toLocaleString()}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span className="font-bold">- PKR {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-primary">
              <span>Total Payable:</span>
              <span>PKR {finalFee.toLocaleString()}</span>
            </div>
          </div>

          {/* Coupon */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Discount Coupon"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm uppercase focus:outline-none"
            />
            <button
              onClick={handleApplyCoupon}
              className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
            >
              Apply
            </button>
          </div>
          {couponMsg.text && (
            <p className={`text-xs font-semibold ${couponMsg.error ? 'text-red-500' : 'text-green-600'}`}>{couponMsg.text}</p>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Select Payment Account</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paymentMethods.map(pm => (
                <div
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.name)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === pm.name ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <p className="font-bold text-sm text-gray-900">{pm.name}</p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{pm.account_number}</p>
                  <p className="text-[11px] text-gray-400">{pm.account_title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Proof Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Upload Payment Screenshot / Receipt</label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
              {paymentProof ? (
                <p className="text-green-600 font-bold text-xs">✓ Payment Proof Uploaded</p>
              ) : (
                <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setPaymentProof)} className="text-xs" />
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-2">
            <button onClick={() => setStep(2)} className="text-text-secondary text-sm font-bold hover:underline cursor-pointer">
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-3 rounded-xl text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center anim-fade-in">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Application Submitted!</h2>
          <p className="text-text-secondary text-sm mb-1">Your Personal Tax Filing request has been submitted successfully.</p>
          <p className="text-xs font-mono font-bold text-primary mb-6">Application ID: #{submittedId}</p>
          <div className="flex justify-center gap-4">
            <Link href="/portal/applications" className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm">
              View in Applications
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
