"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminApplicationDocuments({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    // Try family-tax first, then ntn
    const tryFetch = async () => {
      try {
        const res = await fetch(`/api/family-tax/applications/${id}`);
        const data = await res.json();
        if (data.success) {
          setAppData({ ...data.data, _type: 'family-tax' });
          setLoading(false);
          return;
        }
        // fallback to ntn
        const ntnRes = await fetch(`/api/admin/applications?id=${id}`);
        const ntnData = await ntnRes.json();
        if (ntnData.success && ntnData.data) {
          setAppData({ ...ntnData.data, _type: 'ntn', documents: ntnData.data.documents || [] });
          setLoading(false);
          return;
        }
        setError("Application not found");
        setLoading(false);
      } catch (err) {
        setError("Error loading application");
        setLoading(false);
      }
    };
    tryFetch();
  }, [id]);

  const handlePrintAll = () => {
    window.print();
  };

  const handlePrintOne = (doc) => {
    const w = window.open(doc.file_url, '_blank');
    if (w) {
      setTimeout(() => {
        try { w.print(); } catch (e) {}
      }, 1200);
    }
  };

  const handleDownloadAll = () => {
    if (!appData?.documents) return;
    appData.documents.forEach((d, i) => {
      if (d.file_url) {
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = d.file_url;
          a.download = d.file_name || `document-${i + 1}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }, i * 400);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-text-secondary font-semibold">Loading documents...</p>
      </div>
    );
  }

  if (error || !appData) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500 font-bold mb-4">{error || "No application found"}</p>
        <Link href="/admin/family-tax" className="text-primary font-bold hover:underline">Back to Applications</Link>
      </div>
    );
  }

  const applicantName = appData.full_name || appData.applicant_name || `Application #${appData.order_number || appData.id}`;
  const orderNumber = appData.order_number || appData.id;

  // Collect all downloadable items
  const allFiles = [];
  if (appData.cnic_front_url) allFiles.push({ name: 'CNIC Front', fileName: 'cnic-front.jpg', fileUrl: appData.cnic_front_url, fileType: 'image' });
  if (appData.cnic_back_url) allFiles.push({ name: 'CNIC Back', fileName: 'cnic-back.jpg', fileUrl: appData.cnic_back_url, fileType: 'image' });
  if (appData.selfie_url) allFiles.push({ name: 'Selfie', fileName: 'selfie.jpg', fileUrl: appData.selfie_url, fileType: 'image' });
  if (appData.payment_proof_url) allFiles.push({ name: 'Payment Proof', fileName: 'payment-proof.jpg', fileUrl: appData.payment_proof_url, fileType: 'image' });
  if (appData.admin_file_url) allFiles.push({ name: 'Admin File', fileName: 'admin-file.pdf', fileUrl: appData.admin_file_url, fileType: 'pdf' });
  if (appData.filed_return_url) allFiles.push({ name: 'Filed Return', fileName: 'filed-return.pdf', fileUrl: appData.filed_return_url, fileType: 'pdf' });
  if (appData.wealth_statement_url) allFiles.push({ name: 'Wealth Statement', fileName: 'wealth-statement.pdf', fileUrl: appData.wealth_statement_url, fileType: 'pdf' });
  if (appData.documents && appData.documents.length > 0) {
    appData.documents.forEach(d => {
      allFiles.push({
        name: `${d.category || 'Doc'} / ${(d.doc_type || '').replace(/_/g, ' ')}`,
        fileName: d.file_name,
        fileUrl: d.file_url,
        fileType: d.file_type?.includes('pdf') ? 'pdf' : 'image'
      });
    });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto anim-fade-in">
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 no-print">
        <div>
          <Link href={`/admin/family-tax/${appData.id}`} className="text-xs text-primary font-bold hover:underline mb-1 inline-block">
            ← Back to Application
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">All Documents — #{orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {applicantName} &middot; {allFiles.length} file{allFiles.length !== 1 ? 's' : ''} &middot; Type: {appData._type === 'ntn' ? 'NTN Registration' : 'Family Tax Filing'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {allFiles.length > 0 && (
            <>
              <button
                onClick={handleDownloadAll}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download All
              </button>
              <button
                onClick={handlePrintAll}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block border-b border-gray-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold">DIGITAX — Application Documents</h1>
        <p className="text-sm">Application #{orderNumber} &middot; {applicantName} &middot; Date: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Documents list */}
      {allFiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="font-bold text-text-primary mb-1">No Documents Found</h3>
          <p className="text-sm text-text-secondary">This application has no uploaded documents yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-full-width">
          {allFiles.map((file, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:break-inside-avoid">
              {/* Preview */}
              <div className="relative bg-gray-50 h-48 flex items-center justify-center overflow-hidden">
                {file.fileType === 'pdf' ? (
                  <div className="text-center">
                    <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-xs font-bold text-gray-700 mt-2">PDF Document</p>
                  </div>
                ) : (
                  <img src={file.fileUrl} alt={file.name} className="w-full h-full object-contain" />
                )}
              </div>
              {/* Info & Actions */}
              <div className="p-4">
                <h4 className="font-bold text-sm text-gray-900 capitalize mb-0.5">{file.name}</h4>
                <p className="text-xs text-gray-500 truncate mb-3">{file.fileName}</p>
                <div className="flex flex-wrap gap-2 no-print">
                  <button
                    onClick={() => setPreviewDoc(file)}
                    className="flex-1 min-w-[80px] bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View
                  </button>
                  <a
                    href={file.fileUrl}
                    download={file.fileName}
                    className="flex-1 min-w-[80px] bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download
                  </a>
                  <button
                    onClick={() => handlePrintOne(file)}
                    className="flex-1 min-w-[80px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print / PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 no-print" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-text-primary">{previewDoc.name}</h3>
                <p className="text-xs text-text-secondary truncate">{previewDoc.fileName}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  Download
                </a>
                <button
                  onClick={() => handlePrintOne(previewDoc)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  Print
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-text-primary text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {previewDoc.fileType === 'pdf' ? (
                <iframe src={previewDoc.fileUrl} className="w-full h-[70vh] rounded-lg" title="PDF Preview" />
              ) : (
                <img src={previewDoc.fileUrl} alt={previewDoc.name} className="max-w-full max-h-[70vh] mx-auto object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
