"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function MeetOurTeamTab() {
  const { showToast } = useToast();
  
  // Section Title State
  const [sectionTitle, setSectionTitle] = useState("Meet Our Dream Team");
  const [savingTitle, setSavingTitle] = useState(false);
  const [headingType, setHeadingType] = useState("text"); // "text" | "image"
  const [titleImage, setTitleImage] = useState("");
  const [titleImagePreview, setTitleImagePreview] = useState(null);
  const [uploadingTitleImage, setUploadingTitleImage] = useState(false);

  // Team Banner Image State
  const [teamImage, setTeamImage] = useState("");
  const [teamImagePreview, setTeamImagePreview] = useState(null);
  const [uploadingTeamImage, setUploadingTeamImage] = useState(false);

  // Team Members State
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    role: "",
    photo_url: "",
    display_order: 0,
    enabled: 1
  });
  const [imgPreview, setImgPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchTitle = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const titleSetting = data.find(s => s.key === "team_title");
        if (titleSetting) setSectionTitle(titleSetting.value);
        const headingTypeSetting = data.find(s => s.key === "team_heading_type");
        if (headingTypeSetting) setHeadingType(headingTypeSetting.value);
        const titleImgSetting = data.find(s => s.key === "team_title_image");
        if (titleImgSetting?.value) {
          setTitleImage(titleImgSetting.value);
          setTitleImagePreview(titleImgSetting.value);
        }
        const imageSetting = data.find(s => s.key === "team_section_image");
        if (imageSetting?.value) {
          setTeamImage(imageSetting.value);
          setTeamImagePreview(imageSetting.value);
        }
      }
    } catch {}
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      showToast("Failed to load team members.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTitle();
    fetchMembers();
  }, []);

  const handleSaveTitle = async (e) => {
    e.preventDefault();
    setSavingTitle(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_title: sectionTitle,
          team_heading_type: headingType,
          team_title_image: titleImage,
          team_section_image: teamImage
        })
      });
      if (res.ok) {
        showToast("Section heading updated successfully!", "success");
      } else {
        showToast("Failed to save heading settings.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSavingTitle(false);
    }
  };

  const handleTitleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTitleImagePreview(URL.createObjectURL(file));
    setUploadingTitleImage(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "team");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setTitleImage(data.url);
        setHeadingType("image");
        showToast("Heading banner image uploaded!", "success");
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team_title_image: data.url,
            team_heading_type: "image"
          })
        });
      } else {
        showToast(data.error || "Upload failed.", "error");
      }
    } catch {
      showToast("Upload error.", "error");
    } finally {
      setUploadingTitleImage(false);
    }
  };

  const handleDeleteTitleImage = async () => {
    setTitleImage("");
    setTitleImagePreview(null);
    setHeadingType("text");
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_title_image: "",
          team_heading_type: "text"
        })
      });
      showToast("Heading banner image removed.", "success");
    } catch {
      showToast("Failed to remove image.", "error");
    }
  };

  const handleTeamImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTeamImagePreview(URL.createObjectURL(file));
    setUploadingTeamImage(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "team");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setTeamImage(data.url);
        showToast("Team banner image uploaded!", "success");
        // Save immediately
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team_section_image: data.url })
        });
      } else {
        showToast("Upload failed.", "error");
      }
    } catch {
      showToast("Upload error.", "error");
    } finally {
      setUploadingTeamImage(false);
    }
  };

  const handleDeleteTeamImage = async () => {
    setTeamImage("");
    setTeamImagePreview(null);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_section_image: "" })
      });
      showToast("Team banner image removed.", "success");
    } catch {
      showToast("Failed to remove image.", "error");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImgPreview(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "team");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, photo_url: data.url }));
        showToast("Photo uploaded!", "success");
      } else {
        showToast("Upload failed.", "error");
      }
    } catch {
      showToast("Upload error.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setForm({
      name: "",
      role: "",
      photo_url: "",
      display_order: members.length,
      enabled: 1
    });
    setImgPreview(null);
    setShowModal(true);
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      role: member.role,
      photo_url: member.photo_url || "",
      display_order: member.display_order || 0,
      enabled: member.enabled !== undefined ? member.enabled : 1
    });
    setImgPreview(member.photo_url || null);
    setShowModal(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!form.name || !form.role) return showToast("Name and role are required.", "error");
    setSubmitting(true);
    try {
      const isEdit = !!editingMember;
      const res = await fetch("/api/admin/team", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...form, id: editingMember.id } : form)
      });
      if (res.ok) {
        showToast(isEdit ? "Team member updated!" : "Team member added!", "success");
        setShowModal(false);
        fetchMembers();
      } else {
        showToast("Failed to save member details.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this team member?")) return;
    try {
      const res = await fetch("/api/admin/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast("Team member deleted.", "success");
        fetchMembers();
      } else {
        showToast("Failed to delete.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleToggleEnable = async (member) => {
    const updatedStatus = member.enabled === 1 ? 0 : 1;
    try {
      const res = await fetch("/api/admin/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...member, enabled: updatedStatus })
      });
      if (res.ok) {
        showToast(updatedStatus === 1 ? "Member enabled!" : "Member disabled!", "success");
        fetchMembers();
      }
    } catch {
      showToast("Failed to toggle status.", "error");
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= members.length) return;

    const list = [...members];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;

    // Save display order values
    try {
      await Promise.all(
        list.map((m, idx) =>
          fetch("/api/admin/team", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...m, display_order: idx })
          })
        )
      );
      showToast("Order updated!", "success");
      fetchMembers();
    } catch {
      showToast("Failed to save reordered list.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-8 anim-fade-in max-w-5xl">
      <div>
        <h2 className="text-xl font-bold border-b border-gray-100 pb-4">Dream Team Section Settings</h2>
        <p className="text-text-secondary text-sm mt-1">Manage team profiles and layout configuration.</p>
      </div>

      {/* Title & Heading Config Card */}
      <form onSubmit={handleSaveTitle} className="bg-white rounded-[20px] p-6 border border-gray-200/60 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-text-primary">Customize Section Heading</h3>
            <p className="text-xs text-text-secondary mt-0.5">Choose whether to display standard text or a custom banner image in place of the write-up.</p>
          </div>
          {/* Mode Switch */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setHeadingType("text")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                headingType === "text" ? "bg-white text-primary shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Text Write-up
            </button>
            <button
              type="button"
              onClick={() => setHeadingType("image")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                headingType === "image" ? "bg-white text-primary shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Custom Picture
            </button>
          </div>
        </div>

        {/* Text Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-700">Heading Text (Used as Title / SEO / Fallback)</label>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={sectionTitle} 
              onChange={e => setSectionTitle(e.target.value)} 
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white transition-colors flex-1 text-sm" 
              placeholder="e.g. Meet Our Dream Team"
            />
            <button 
              type="submit" 
              disabled={savingTitle} 
              className="bg-primary text-white font-bold px-6 rounded-xl text-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
            >
              {savingTitle ? "Saving..." : "Update Title"}
            </button>
          </div>
        </div>

        {/* Heading Image Upload (Shown when Custom Picture mode is selected, or can be uploaded directly) */}
        {headingType === "image" && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-48 h-24 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {titleImagePreview ? (
                <img src={titleImagePreview} alt="Heading Banner" className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-[11px] text-gray-400 font-medium">No picture uploaded yet</span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h4 className="text-xs font-bold text-gray-900">Heading Banner Picture</h4>
              <p className="text-[11px] text-gray-500">This picture will replace the "Meet Our Dream Team" write-up on the website.</p>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <label className="inline-flex items-center gap-1.5 bg-primary text-white font-bold px-3.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-primary/90 transition-colors shadow-xs">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {uploadingTitleImage ? "Uploading..." : titleImagePreview ? "Change Picture" : "Upload Picture"}
                  <input type="file" accept="image/*" onChange={handleTitleImageUpload} className="hidden" disabled={uploadingTitleImage} />
                </label>
                {titleImagePreview && (
                  <button
                    type="button"
                    onClick={handleDeleteTitleImage}
                    className="text-red-600 hover:text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Remove Picture
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Team Banner Image Upload */}
      <div className="bg-white rounded-[20px] p-6 border border-gray-200/60 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-sm text-text-primary">Team Section Banner Image</h3>
            <p className="text-xs text-text-secondary mt-1">Images uploaded here will appear in the Team Section on the homepage.</p>
          </div>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full uppercase">Frontend Banner</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Image Preview */}
          <div className="w-full sm:w-64 h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {teamImagePreview ? (
              <img src={teamImagePreview} alt="Team Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-text-secondary">Image will be uploaded soon</span>
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer hover:bg-primary/20 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              {teamImagePreview ? "Replace Image" : "Upload Image"}
              <input type="file" accept="image/*" onChange={handleTeamImageUpload} className="hidden" />
            </label>
            {teamImagePreview && (
              <button 
                onClick={handleDeleteTeamImage}
                className="flex items-center gap-2 text-error font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-error/5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete Image
              </button>
            )}
            {uploadingTeamImage && (
              <span className="text-xs text-primary font-medium animate-pulse">Uploading...</span>
            )}
            <span className="text-[11px] text-text-secondary">Recommended: 1200×500px, JPG or PNG</span>
          </div>
        </div>
      </div>

      {/* Team Listing Card */}
      <div className="bg-white rounded-[20px] border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <span className="font-bold text-lg text-text-primary">All Members</span>
          <button 
            onClick={handleOpenAdd} 
            className="bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            + Add Team Member
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-4">
            {members.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-text-secondary text-xs uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-16">Order</th>
                      <th className="px-4 py-3 font-semibold">Avatar</th>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold text-center w-24">Status</th>
                      <th className="px-4 py-3 font-semibold text-right w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {members.map((member, idx) => (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-text-secondary">
                          <div className="flex items-center gap-1.5">
                            <button 
                              disabled={idx === 0} 
                              onClick={() => handleMove(idx, "up")} 
                              className="p-1 hover:text-primary disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button 
                              disabled={idx === members.length - 1} 
                              onClick={() => handleMove(idx, "down")} 
                              className="p-1 hover:text-primary disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-12 h-14 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center p-1">
                            {member.photo_url ? (
                              <img src={member.photo_url} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-primary font-bold text-sm">{member.name.charAt(0)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-text-primary">{member.name}</td>
                        <td className="px-4 py-3 text-text-secondary">{member.role}</td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => handleToggleEnable(member)} 
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                              member.enabled === 1 ? "bg-success/10 text-success" : "bg-gray-100 text-text-secondary"
                            }`}
                          >
                            {member.enabled === 1 ? "Active" : "Disabled"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleOpenEdit(member)} 
                            className="text-primary hover:bg-primary/10 p-2 rounded-lg mr-1 cursor-pointer text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(member.id)} 
                            className="text-error hover:bg-error/10 p-2 rounded-lg cursor-pointer text-xs font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8">No team members added yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto anim-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative my-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6">{editingMember ? "Edit Team Member" : "New Team Member"}</h3>
            <form onSubmit={handleSaveMember} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-primary">Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center p-1">
                    {imgPreview ? (
                      <img src={imgPreview} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-text-secondary text-xs">No Photo</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleUpload} className="text-xs text-text-secondary" />
                </div>
                {uploading && <span className="text-xs text-primary font-medium animate-pulse">Uploading photo...</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Tariq Mahmood" 
                  required 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="border border-premium rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">Role / Position</label>
                <input 
                  type="text" 
                  placeholder="e.g. FBR Specialist" 
                  required 
                  value={form.role} 
                  onChange={e => setForm({...form, role: e.target.value})} 
                  className="border border-premium rounded-xl px-4 py-3 focus:outline-primary bg-gray-50 focus:bg-white text-sm" 
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-text-primary">Active Status</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={form.enabled === 1} 
                    onChange={e => setForm({...form, enabled: e.target.checked ? 1 : 0})} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex gap-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-3 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-primary/30 shadow-sm hover-scale text-sm"
                >
                  {submitting ? "Saving..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
