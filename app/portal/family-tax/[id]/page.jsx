"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function ApplicationDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentOptions, setPaymentOptions] = useState([]);
  
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/family-tax/applications/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAppData(data.data);
        } else {
          setError(data.error || "Failed to load application");
        }
        setLoading(false);
      })
      .catch(err => {
        setError("Error loading application");
        setLoading(false);
      });

    fetch('/api/payment-methods')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setPaymentOptions(data.data);
          setPaymentMethod(data.data[0].name);
        }
      })
      .catch(err => console.error("Error fetching payment methods", err));
  }, [id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "payment");
    formData.append("docType", "proof");

    try {
      const res = await fetch("/api/family-tax/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setPaymentProofUrl(data.file.fileUrl);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  };

  const submitPaymentProof = async () => {
    if (!paymentProofUrl) {
      alert("Please upload payment proof");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/family-tax/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: id,
          paymentMethod,
          paymentProofUrl,
          transactionRef
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Payment proof submitted successfully!");
        window.location.reload();
      } else {
        alert(data.error || "Submission failed");
      }
    } catch (err) {
      alert("Error submitting payment proof");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-text-secondary">Loading application details...</p>
    </div>
  );

  if (error || !appData) return (
    <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center anim-fade-in">
      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Application Not Found</h2>
      <p className="text-text-secondary text-sm mb-6">
        {error || "The application you are trying to view does not exist or may have been removed."}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => router.push('/portal/applications')}
          className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all cursor-pointer"
        >
          Back to Applications
        </button>
        <button
          onClick={() => router.push('/portal')}
          className="border border-gray-200 text-text-secondary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all cursor-pointer"
        >
          Portal Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20 anim-fade-in">
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Family Tax Application</h1>
            <p className="text-sm text-text-secondary mt-1">Ref: #{appData.order_number}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 no-print"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print / PDF
            </button>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              appData.status === 'Payment Pending' ? 'bg-amber-100 text-amber-700' :
              appData.status === 'Completed' ? 'bg-green-100 text-green-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {appData.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
          <div><span className="text-gray-500 block text-xs">Applicant Name</span><strong className="text-text-primary">{appData.full_name}</strong></div>
          <div><span className="text-gray-500 block text-xs">CNIC</span><strong className="text-text-primary">{appData.cnic}</strong></div>
          <div><span className="text-gray-500 block text-xs">Submission Date</span><strong className="text-text-primary">{new Date(appData.created_at).toLocaleDateString()}</strong></div>
          <div>
            <span className="text-gray-500 block text-xs">Total Fee</span>
            <strong className="text-primary">
              PKR {appData.amount || 5000}
              {appData.discount_amount > 0 && <span className="text-xs text-green-600 font-bold ml-1">(Discounted)</span>}
            </strong>
          </div>
        </div>

        {appData.filed_return_url && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <h3 className="font-bold text-green-900 text-base mb-1">Your Filed Tax Return is Ready!</h3>
            <p className="text-xs text-green-700 mb-4">Your official tax return has been completed and processed by DIGITAX tax consultants.</p>
            <div className="flex flex-wrap gap-3">
              <a
                href={appData.filed_return_url}
                target="_blank"
                rel="noreferrer"
                download
                className="bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Filed Return (PDF/Doc)
              </a>
              {appData.wealth_statement_url && (
                <a
                  href={appData.wealth_statement_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="bg-white text-green-700 border border-green-300 font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-green-50 transition-all flex items-center gap-2"
                >
                  Download Wealth Statement
                </a>
              )}
            </div>
          </div>
        )}

        {appData.status === 'Payment Pending' && (
          <div className="bg-slate-50 rounded-xl p-5 border border-gray-200 mt-6 no-print">
            <h3 className="font-bold text-primary mb-4">Complete Your Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {paymentOptions.length > 0 ? (
                paymentOptions.map((opt) => (
                  <div key={opt.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 mb-1">{opt.name}</p>
                    <p className="text-sm font-bold text-text-primary">{opt.account_number}</p>
                    <p className="text-xs text-text-secondary">Title: {opt.account_title}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-sm text-gray-500">Loading payment methods...</div>
              )}
            </div>

            <div className="flex flex-col gap-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">Payment Method Used *</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {paymentOptions.map(opt => (
                    <option key={opt.id} value={opt.name}>{opt.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">Transaction Ref / TID (Optional)</label>
                <input 
                  type="text" 
                  value={transactionRef} 
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="e.g. 0123456789"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">Upload Receipt / Screenshot *</label>
                <div className="flex items-center gap-3">
                  <label className="bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-primary/20 transition-all">
                    {uploading ? "Uploading..." : "Choose File"}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  {paymentProofUrl && <span className="text-xs text-green-600 font-bold">File uploaded ✓</span>}
                </div>
              </div>

              <button 
                onClick={submitPaymentProof}
                disabled={submitting || !paymentProofUrl}
                className="mt-2 w-full bg-primary text-white font-bold text-sm py-3 rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Submitting..." : "Submit Payment Proof"}
              </button>
            </div>
          </div>
        )}

        {appData.status !== 'Payment Pending' && (
          <div className="mt-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-text-primary mb-2">Application Status: {appData.status}</h3>
            <p className="text-sm text-text-secondary max-w-md">
              We have received your application. Our tax experts are reviewing your details. You will be notified as soon as your filing is completed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
