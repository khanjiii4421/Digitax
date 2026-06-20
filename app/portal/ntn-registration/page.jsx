"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const DRAFT_KEY_PREFIX = "ntn_draft_";
const CATEGORIES = [
  { id: "individual", label: "Individual", desc: "Personal NTN for salaried/freelance" },
  { id: "aop", label: "AOP", desc: "Association of Persons" },
  { id: "partnership", label: "Partnership Firm", desc: "Registered partnership business" },
  { id: "private-limited", label: "Private Limited", desc: "SECP registered company" },
  { id: "sole-proprietor", label: "Sole Proprietor", desc: "Single owner business" },
];

const STEPS = ["Category", "CNIC Upload", "Selfie", "Payment", "Confirmation"];

export default function NTNRegistration() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [resumed, setResumed] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const selfieInputRef = useRef(null);
  const proofInputRef = useRef(null);

  // Fetch active payment methods
  useEffect(() => {
    fetch("/api/admin/payment-methods")
      .then(r => r.json())
      .then(d => { if (d.success) setPaymentMethods(d.methods.filter(m => m.is_active)); })
      .catch(() => {});

    // Restore draft from localStorage
    try {
      fetch("/api/auth/me").then(r => r.json()).then(data => {
        const uid = data?.data?.user?.id;
        if (!uid) return;
        const draft = localStorage.getItem(DRAFT_KEY_PREFIX + uid);
        if (draft) {
          const d = JSON.parse(draft);
          if (d.category) setCategory(d.category);
          if (d.cnicFront) setCnicFront(d.cnicFront);
          if (d.cnicBack) setCnicBack(d.cnicBack);
          if (d.selfie) setSelfie(d.selfie);
          if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
          if (d.paymentProof) setPaymentProof(d.paymentProof);
          if (d.step && d.step > 0) { setStep(d.step); setResumed(true); }
        }
      });
    } catch(e) {}
  }, []);

  // Auto-save draft to localStorage on any state change
  useEffect(() => {
    const saveDraft = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        const uid = data?.data?.user?.id;
        if (!uid || step >= 4) return;
        const draft = { step, category, cnicFront, cnicBack, selfie, paymentMethod, paymentProof, savedAt: Date.now() };
        localStorage.setItem(DRAFT_KEY_PREFIX + uid, JSON.stringify(draft));
      } catch(e) {}
    };
    saveDraft();
  }, [step, category, cnicFront, cnicBack, selfie, paymentMethod, paymentProof]);

  // Clear draft
  const clearDraft = () => {
    try {
      fetch("/api/auth/me").then(r => r.json()).then(data => {
        const uid = data?.data?.user?.id;
        if (uid) localStorage.removeItem(DRAFT_KEY_PREFIX + uid);
      });
    } catch(e) {}
  };

  // Start fresh
  const startFresh = () => {
    setCategory(""); setCnicFront(null); setCnicBack(null); setSelfie(null);
    setPaymentMethod(""); setPaymentProof(null); setStep(0); setResumed(false);
    clearDraft();
  };

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Capture selfie from camera
  const captureSelfie = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setSelfie(dataUrl);
    stopCamera();
  }, [stopCamera]);

  // Stop camera on step change or unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  // Upload file to server
  const uploadFile = async (file, folder) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url || null;
  };

  // Upload base64 image
  const uploadBase64 = async (dataUrl, filename, folder) => {
    const byteString = atob(dataUrl.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: "image/jpeg" });
    const file = new File([blob], filename, { type: "image/jpeg" });
    return uploadFile(file, folder);
  };

  // Handle file upload for CNIC
  const handleCnicUpload = async (e, side) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("File too large. Max 5MB.");
    const url = await uploadFile(file, "applications");
    if (side === "front") setCnicFront(url);
    else setCnicBack(url);
  };

  // Handle selfie file upload fallback
  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("File too large. Max 5MB.");
    const url = await uploadFile(file, "applications");
    setSelfie(url);
  };

  // Handle payment proof upload
  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("File too large. Max 5MB.");
    const url = await uploadFile(file, "applications");
    setPaymentProof(url);
  };

  // Can go next?
  const canNext = () => {
    if (step === 0) return !!category;
    if (step === 1) return !!cnicFront && !!cnicBack;
    if (step === 2) return !!selfie;
    if (step === 3) return !!paymentMethod && !!paymentProof;
    return false;
  };

  // Submit application
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          cnic_front_url: cnicFront,
          cnic_back_url: cnicBack,
          selfie_url: selfie,
          payment_method: paymentMethod,
          payment_proof_url: paymentProof,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApplicationId(data.id);
        setStep(4);
        clearDraft();
      } else {
        alert(data.error || "Submission failed.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-6 anim-fade-in">
      {/* Resume Banner */}
      {resumed && step < 4 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm text-blue-800 font-medium">Resuming from where you left off</p>
          </div>
          <button onClick={startFresh} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all cursor-pointer">Start Fresh</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">NTN Registration</h1>
        <p className="text-text-secondary mt-1 text-sm">Register your National Tax Number with FBR. Fee: <strong className="text-primary">Rs 1,500</strong></p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all ${
                  i < step ? "bg-green-500 text-white" : i === step ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-gray-100 text-gray-400"
                }`}>
                  {i < step ? (
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : i + 1}
                </div>
                <span className={`text-[10px] md:text-xs mt-1 font-medium text-center ${i <= step ? "text-text-primary" : "text-gray-400"}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-5 transition-all ${i < step ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 min-h-[400px]">

        {/* Step 0: Category */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Select Business Category</h2>
            <p className="text-sm text-text-secondary mb-6">Choose the type of NTN registration you need.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    category === c.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-100 hover:border-primary/30 hover:bg-gray-50"
                  }`}
                >
                  <p className="font-bold text-text-primary text-sm">{c.label}</p>
                  <p className="text-xs text-text-secondary mt-1">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: CNIC Upload */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Upload CNIC Images</h2>
            <p className="text-sm text-text-secondary mb-6">Upload clear photos of your CNIC front and back.</p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-amber-800 mb-1">Instructions:</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Upload clear photo - no blur or glare</li>
                <li>All 4 corners of CNIC must be visible</li>
                <li>Good lighting, plain background preferred</li>
                <li>Accepted formats: JPG, PNG (max 5MB)</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">CNIC Front Side</label>
                {cnicFront ? (
                  <div className="relative">
                    <img src={cnicFront} alt="CNIC Front" className="w-full aspect-[1.586/1] object-cover rounded-xl border border-gray-200" />
                    <button onClick={() => setCnicFront(null)} className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-red-600">X</button>
                  </div>
                ) : (
                  <button onClick={() => frontInputRef.current?.click()} className="w-full aspect-[1.586/1] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm text-gray-400 font-medium">Upload Front Side</span>
                  </button>
                )}
                <input ref={frontInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleCnicUpload(e, "front")} />
              </div>

              {/* Back */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">CNIC Back Side</label>
                {cnicBack ? (
                  <div className="relative">
                    <img src={cnicBack} alt="CNIC Back" className="w-full aspect-[1.586/1] object-cover rounded-xl border border-gray-200" />
                    <button onClick={() => setCnicBack(null)} className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-red-600">X</button>
                  </div>
                ) : (
                  <button onClick={() => backInputRef.current?.click()} className="w-full aspect-[1.586/1] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm text-gray-400 font-medium">Upload Back Side</span>
                  </button>
                )}
                <input ref={backInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleCnicUpload(e, "back")} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Selfie */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Upload Your Selfie</h2>
            <p className="text-sm text-text-secondary mb-6">Take a live selfie or upload a clear photo of your face.</p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-amber-800 mb-1">Instructions:</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Clear face - no sunglasses, mask, or hat</li>
                <li>Good lighting, face the camera directly</li>
                <li>Plain background preferred</li>
              </ul>
            </div>

            <div className="max-w-md mx-auto">
              {selfie ? (
                <div className="relative">
                  <img src={selfie} alt="Selfie" className="w-full h-64 object-cover rounded-xl border border-gray-200" />
                  <button onClick={() => { setSelfie(null); }} className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-red-600">X</button>
                </div>
              ) : cameraActive ? (
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover rounded-xl border border-gray-200 bg-black" />
                  <canvas ref={canvasRef} className="hidden" />
                  <button onClick={captureSelfie} className="mt-4 w-full bg-primary text-white font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Capture Photo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <button onClick={startCamera} className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Open Camera
                  </button>
                  <div className="text-center text-sm text-text-secondary">or</div>
                  <button onClick={() => selfieInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 text-text-secondary font-bold py-4 rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                    Upload Photo Instead
                  </button>
                  <input ref={selfieInputRef} type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Payment Method</h2>
            <p className="text-sm text-text-secondary mb-6">Send <strong className="text-primary">Rs 1,500</strong> to any of the following accounts, then select the method below.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {paymentMethods.map(pm => (
                <div
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.name)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === pm.name
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-100 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {pm.logo_url ? (
                      <img src={pm.logo_url} alt={pm.name} className="w-12 h-8 object-contain" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        pm.name === "Easypaisa" ? "bg-green-500" : pm.name === "JazzCash" ? "bg-red-500" : "bg-blue-500"
                      }`}>
                        {pm.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-text-primary">{pm.name}</p>
                      <p className="text-xs text-text-secondary">{pm.account_title}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-text-secondary">Account Number</p>
                    <p className="text-sm font-bold text-text-primary tracking-wider">{pm.account_number}</p>
                  </div>
                </div>
              ))}
            </div>

            {paymentMethod && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="font-bold text-green-800 text-sm">{paymentMethod} Selected</p>
                </div>
                <p className="text-xs text-green-700">Please send Rs 1,500 to the account shown above, then upload your payment screenshot below.</p>
              </div>
            )}

            {/* Payment Screenshot Upload */}
            <div className="mt-4">
              <label className="block text-sm font-bold text-text-primary mb-2">Upload Payment Screenshot <span className="text-red-500">*</span></label>
              <p className="text-xs text-text-secondary mb-3">Upload a screenshot/receipt of your payment as proof.</p>
              {paymentProof ? (
                <div className="relative max-w-sm">
                  <img src={paymentProof} alt="Payment Proof" className="w-full rounded-xl border border-gray-200" />
                  <button onClick={() => setPaymentProof(null)} className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-red-600">X</button>
                </div>
              ) : (
                <button onClick={() => proofInputRef.current?.click()} className="w-full max-w-sm h-36 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm text-gray-400 font-medium">Upload Screenshot</span>
                </button>
              )}
              <input ref={proofInputRef} type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Application Submitted!</h2>
            <p className="text-text-secondary mb-6">Your NTN Registration application (ID: #{String(applicationId)}) has been submitted successfully.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto mb-6">
              <p className="text-sm text-blue-800 font-medium">Your application is under review. We will verify your payment and notify you once processing begins.</p>
            </div>
            <a href="/portal/applications" className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-xl text-sm hover:scale-105 active:scale-95 transition-all">
              View My Applications
            </a>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {step < 4 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => { if (step > 0) { if (step === 2) stopCamera(); setStep(step - 1); } }}
            disabled={step === 0}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              step === 0 ? "opacity-30 cursor-not-allowed text-gray-400" : "bg-gray-100 text-text-primary hover:bg-gray-200"
            }`}
          >
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className={`px-8 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                canNext() ? "bg-primary text-white hover:scale-105 active:scale-95 shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
              className={`px-8 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
                canNext() && !submitting ? "bg-primary text-white hover:scale-105 active:scale-95 shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Submitting...
                </>
              ) : "Submit Application"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
