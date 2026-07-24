"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminFamilyTaxDetail({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actioning, setActioning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
  }, [id]);

  const handleAction = async (action, newStatus = "", extraPayload = {}) => {
    if ((action === 'reject_payment' || action === 'request_documents') && !adminNotes.trim()) {
      alert("Please provide notes for this action.");
      return;
    }

    if (action !== 'delete' && !confirm(`Are you sure you want to perform this action?`)) {
      return;
    }

    setActioning(true);
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/admin/family-tax/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          alert("Application deleted successfully.");
          router.push("/admin/family-tax");
          return;
        } else {
          alert(data.error || "Failed to delete application");
        }
      } else {
        const res = await fetch(`/api/admin/family-tax/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            notes: adminNotes,
            status: newStatus,
            ...extraPayload
          })
        });
        const data = await res.json();
        if (data.success) {
          alert("Action completed successfully");
          window.location.reload();
        } else {
          alert(data.error || "Action failed");
        }
      }
    } catch (err) {
      alert("Error performing action");
    } finally {
      setActioning(false);
    }
  };

  const handleAdminFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "admin_document");
    formData.append("docType", docType);

    try {
      const res = await fetch("/api/family-tax/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        const actionName = docType === 'admin_filed_return' ? 'upload_return' : 'upload_wealth_statement';
        await handleAction(actionName, '', { fileUrl: data.file.fileUrl });
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Error uploading document");
    } finally {
      setUploading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-10 text-center text-primary font-bold">Loading application details...</div>;
  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
  if (!appData) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-full-width { width: 100% !important; max-width: 100% !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application #{appData.order_number}</h1>
          <p className="text-sm text-gray-500 mt-1">Submitted on {new Date(appData.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print / Save PDF
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Delete Application
          </button>
          <Link href="/admin/family-tax" className="text-sm font-bold text-primary hover:underline self-center">
            &larr; Back to List
          </Link>
        </div>
      </div>

      {/* Printable Header for PDF */}
      <div className="hidden print:block border-b border-gray-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold">DIGITAX — Family Tax Filing Application Dossier</h1>
        <p className="text-sm">Order #{appData.order_number} | Date: {new Date(appData.created_at).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print-full-width">
        
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6 print-full-width">
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Applicant Information</h2>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500 block text-xs">Full Name</span><strong className="text-gray-900">{appData.full_name}</strong></div>
              <div><span className="text-gray-500 block text-xs">CNIC</span><strong className="text-gray-900">{appData.cnic}</strong></div>
              <div><span className="text-gray-500 block text-xs">DOB</span><strong className="text-gray-900">{appData.dob}</strong></div>
              <div><span className="text-gray-500 block text-xs">Father Name</span><strong className="text-gray-900">{appData.father_name}</strong></div>
              <div><span className="text-gray-500 block text-xs">Marital Status</span><strong className="text-gray-900">{appData.marital_status}</strong></div>
              <div><span className="text-gray-500 block text-xs">Gender</span><strong className="text-gray-900">{appData.gender}</strong></div>
              <div><span className="text-gray-500 block text-xs">Mobile</span><strong className="text-gray-900">{appData.mobile}</strong></div>
              <div><span className="text-gray-500 block text-xs">WhatsApp</span><strong className="text-gray-900">{appData.whatsapp}</strong></div>
              <div><span className="text-gray-500 block text-xs">Email</span><strong className="text-gray-900">{appData.email}</strong></div>
              <div><span className="text-gray-500 block text-xs">Occupation</span><strong className="text-gray-900">{appData.occupation}</strong></div>
              <div><span className="text-gray-500 block text-xs">Employer</span><strong className="text-gray-900">{appData.employer_name}</strong></div>
              <div><span className="text-gray-500 block text-xs">NTN</span><strong className="text-gray-900">{appData.ntn || 'N/A'}</strong></div>
              <div className="col-span-2"><span className="text-gray-500 block text-xs">Address</span><strong className="text-gray-900">{appData.address}, {appData.city}, {appData.province} {appData.postal_code}</strong></div>
              <div><span className="text-gray-500 block text-xs">Digital Signature</span><strong className="text-primary">{appData.digital_signature || 'Signed'}</strong></div>
            </div>
          </div>

          {/* Members Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Family Members</h2>
            </div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">CNIC/B-Form</th>
                    <th className="px-4 py-2">Monthly Inc.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appData.members?.map((m, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 capitalize">{m.member_type} {m.relationship ? `(${m.relationship})` : ''}</td>
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3">{m.cnic || m.bform_cnic || '-'}</td>
                      <td className="px-4 py-3">{m.monthly_income ? `PKR ${m.monthly_income}` : '-'}</td>
                    </tr>
                  ))}
                  {(!appData.members || appData.members.length === 0) && (
                    <tr><td colSpan="4" className="px-4 py-3 text-center text-gray-500">No members declared</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assets Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Assets Breakdown</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {appData.assets?.map((a, i) => (
                  <div key={i} className="p-3 border border-gray-100 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div><span className="text-xs text-gray-500 block">Type</span><strong>{a.asset_type}</strong></div>
                    <div className="md:col-span-2"><span className="text-xs text-gray-500 block">Title</span><strong>{a.title}</strong></div>
                    <div><span className="text-xs text-gray-500 block">Current Val.</span><strong>PKR {a.current_value}</strong></div>
                    <div><span className="text-xs text-gray-500 block">Ownership</span><strong>{a.ownership_percentage}%</strong></div>
                    {a.purchase_date && <div><span className="text-xs text-gray-500 block">Purchased</span><strong>{a.purchase_date}</strong></div>}
                  </div>
                ))}
                {(!appData.assets || appData.assets.length === 0) && (
                  <p className="text-sm text-gray-500">No assets declared</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Bank Accounts Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Bank Accounts</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {appData.bankAccounts?.map((b, i) => (
                  <div key={i} className="p-3 border border-gray-100 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div><span className="text-xs text-gray-500 block">Bank</span><strong>{b.bank_name}</strong></div>
                    <div className="md:col-span-2"><span className="text-xs text-gray-500 block">Account</span><strong>{b.account_number} ({b.account_title})</strong></div>
                  </div>
                ))}
                {(!appData.bankAccounts || appData.bankAccounts.length === 0) && (
                  <p className="text-sm text-gray-500">No bank accounts declared</p>
                )}
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Documents Uploaded ({appData.documents?.length || 0})</h2>
              {appData.documents && appData.documents.length > 0 && (
                <button
                  onClick={() => {
                    const urls = appData.documents.map(d => d.file_url).filter(Boolean);
                    window.open(`/admin/documents/${appData.id}`, '_blank');
                  }}
                  className="text-xs font-bold text-primary hover:underline no-print flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Open Documents Page
                </button>
              )}
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-3">
                {appData.documents?.map((d, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 capitalize">{d.category} / {d.doc_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500 truncate">{d.file_name}</p>
                    </div>
                    <div className="flex items-center gap-2 no-print shrink-0">
                      <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View
                      </a>
                      <a href={d.file_url} download={d.file_name} className="text-xs font-bold text-green-700 hover:bg-green-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download
                      </a>
                      <button
                        onClick={() => {
                          const w = window.open(d.file_url, '_blank');
                          if (w) setTimeout(() => w.print(), 800);
                        }}
                        className="text-xs font-bold text-purple-700 hover:bg-purple-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print
                      </button>
                    </div>
                  </div>
                ))}
                {(!appData.documents || appData.documents.length === 0) && (
                  <p className="text-sm text-gray-500">No documents attached</p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6 no-print">
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Action Center</h3>
            
            <div className="mb-4">
              <span className="text-xs text-gray-500 block mb-1">Payment Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                appData.payment_status === 'Payment Verified' ? 'bg-green-100 text-green-700' :
                appData.payment_status === 'Rejected' ? 'bg-red-100 text-red-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {appData.payment_status}
              </span>
            </div>

            <div className="mb-4">
              <span className="text-xs text-gray-500 block mb-1">App Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                appData.status === 'Completed' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {appData.status}
              </span>
            </div>

            {appData.coupon_code && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
                <p className="font-bold text-green-800">Coupon Code Applied: {appData.coupon_code}</p>
                <p className="text-green-700 mt-0.5">Discount: PKR {appData.discount_amount}</p>
              </div>
            )}

            {appData.payment && (
              <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <p className="font-bold text-gray-900 mb-2">Payment Details</p>
                <p><span className="text-gray-500">Method:</span> {appData.payment.payment_method}</p>
                <p><span className="text-gray-500">Ref:</span> {appData.payment.transaction_ref || 'N/A'}</p>
                <p><span className="text-gray-500">Amount:</span> PKR {appData.payment.amount}</p>
                {appData.payment.payment_proof_url && (
                  <a href={appData.payment.payment_proof_url} target="_blank" rel="noreferrer" className="block mt-2 text-xs font-bold text-primary hover:underline">
                    View Payment Receipt
                  </a>
                )}
              </div>
            )}

            {/* Admin Document Upload Section (PDF, DOCX, Word, Images) */}
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Upload Completed Filing Files</h4>
              <p className="text-xs text-gray-500">Upload PDF, Word (DOCX), or images of the filed return to share with client.</p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Filed Tax Return (PDF/Word/Doc)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  disabled={uploading}
                  onChange={e => handleAdminFileUpload(e, 'admin_filed_return')}
                  className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Wealth Statement (PDF/Word/Doc)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  disabled={uploading}
                  onChange={e => handleAdminFileUpload(e, 'admin_wealth_statement')}
                  className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              {uploading && <p className="text-xs text-primary font-bold animate-pulse">Uploading file...</p>}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">Admin Notes (Required for rejection/doc requests)</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows="3"
                placeholder="Enter notes here..."
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
              />

              {appData.payment_status === 'Payment Verification Pending' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => handleAction('approve_payment')}
                    disabled={actioning}
                    className="bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 cursor-pointer"
                  >
                    Verify Payment
                  </button>
                  <button 
                    onClick={() => handleAction('reject_payment')}
                    disabled={actioning}
                    className="bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700 cursor-pointer"
                  >
                    Reject Payment
                  </button>
                </div>
              )}

              {appData.payment_status === 'Payment Verified' && appData.status !== 'Completed' && (
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => handleAction('update_status', 'Processing')}
                    disabled={actioning}
                    className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Mark as Processing
                  </button>
                  <button 
                    onClick={() => handleAction('update_status', 'FBR Submitted')}
                    disabled={actioning}
                    className="w-full bg-purple-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-purple-700 cursor-pointer"
                  >
                    Mark as FBR Submitted
                  </button>
                  <button 
                    onClick={() => handleAction('update_status', 'Completed')}
                    disabled={actioning}
                    className="w-full bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 cursor-pointer"
                  >
                    Mark as Completed
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Application?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete application <strong>#{appData.order_number}</strong>? This will permanently remove all family members, assets, bank accounts, and uploaded documents.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('delete')}
                disabled={actioning}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl cursor-pointer"
              >
                {actioning ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
