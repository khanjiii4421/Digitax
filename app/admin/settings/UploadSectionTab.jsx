"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function UploadSectionTab() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/admin/uploads");
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
        setFiles(data.files || []);
      }
    } catch {
      showToast("Failed to load uploads.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", selectedFolder || "general");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        showToast("File uploaded successfully!", "success");
        fetchMedia();
      } else {
        showToast(data.error || "Upload failed.", "error");
      }
    } catch {
      showToast("Upload error.", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const currentFiles = selectedFolder
    ? files.filter(f => f.folder === selectedFolder)
    : files;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 anim-fade-in max-w-5xl">
      <div>
        <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Media & Uploads</h2>
        <p className="text-text-secondary text-sm mt-1">Browse and manage all uploaded media files.</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-[20px] p-6 border border-gray-200/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-text-primary">Upload New File</h3>
          <select
            value={selectedFolder || ""}
            onChange={e => setSelectedFolder(e.target.value || null)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-primary bg-gray-50 cursor-pointer"
          >
            <option value="">All Folders</option>
            {folders.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
            <option value="general">General</option>
          </select>
        </div>
        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl py-8 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span className="text-sm text-text-secondary font-medium">
            {uploading ? "Uploading..." : "Click to upload a file"}
          </span>
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* File Grid */}
      <div className="bg-white rounded-[20px] p-6 border border-gray-200/60 shadow-sm">
        <h3 className="font-bold text-sm text-text-primary mb-4">
          {selectedFolder ? `Files in /${selectedFolder}` : "All Files"} 
          <span className="text-text-secondary font-normal ml-2">({currentFiles.length})</span>
        </h3>

        {currentFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentFiles.map((file, idx) => (
              <div key={idx} className="group relative rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow bg-gray-50">
                <div className="aspect-square flex items-center justify-center p-2">
                  {file.url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.url) ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-text-secondary">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-[10px]">{file.name?.split('.').pop()?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="px-2 pb-2">
                  <p className="text-[10px] text-text-secondary truncate font-mono">{file.name}</p>
                  {file.folder && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{file.folder}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-text-secondary py-8">No files found.</p>
        )}
      </div>
    </div>
  );
}
