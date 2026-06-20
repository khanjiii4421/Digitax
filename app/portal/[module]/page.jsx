"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const comingSoonServices = {
  "personal-tax": {
    title: "Personal Tax Filing",
    description: "File your personal income tax returns with our qualified consultants. Quick, accurate, and fully compliant with FBR regulations.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
  },
  "family-tax": {
    title: "Family Tax Filing",
    description: "File tax returns for your entire family in one place. We handle individual and family tax planning efficiently.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
  },
  "ntn-registration": {
    title: "NTN Registration",
    description: "Get your National Tax Number (NTN) registered with FBR quickly. Essential for business operations and tax compliance.",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
  },
  "iris-profile": {
    title: "IRIS Profile Update",
    description: "Update and manage your FBR IRIS profile. Keep your tax records current and compliant with latest regulations.",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
  },
  "business-incorporation": {
    title: "Business Incorporation",
    description: "Register your business entity with SECP. We handle complete company incorporation from documentation to registration.",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
  },
  "gst-registration": {
    title: "GST Registration",
    description: "Register for General Sales Tax (GST) with FBR. Mandatory for businesses exceeding the taxable threshold.",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
  },
  "service-charges": {
    title: "Service Charges",
    description: "View our complete list of service charges for all tax filing, registration, and corporate services.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
  },
  "faq": {
    title: "FAQ",
    description: "Find answers to frequently asked questions about tax filing, NTN registration, business incorporation, and more.",
    icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
  },
  "blog-updates": {
    title: "Blog & Updates",
    description: "Stay updated with the latest tax laws, FBR notifications, business news, and financial planning tips.",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
  },
  "videos": {
    title: "Videos",
    description: "Watch our video tutorials and guides on tax filing, FBR compliance, and business registration processes.",
    icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
  }
};

export default function PortalModulePlaceholder() {
  const params = useParams();
  const router = useRouter();
  const module = params.module || "";
  const moduleName = module.replace(/-/g, " ");

  const [queries, setQueries] = useState([]);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [expandedQueryId, setExpandedQueryId] = useState(null);
  const [clientReply, setClientReply] = useState('');
  const [newQuerySubject, setNewQuerySubject] = useState("");
  const [newQueryMessage, setNewQueryMessage] = useState("");
  const [personalInfo, setPersonalInfo] = useState({
    name: "Client User",
    email: "client@example.com",
    phone: "0300 1234567",
    cnic: "42101-1234567-1",
  });

  const fetchPortalQueries = async () => {
    setQueriesLoading(true);
    try {
      const res = await fetch('/api/portal/queries');
      if (res.ok) {
        const data = await res.json();
        setQueries(data);
      }
    } catch(e) {}
    setQueriesLoading(false);
  };

  useEffect(() => {
    if (module === 'queries') fetchPortalQueries();
  }, [module]);

  const handleAddQuery = async (e) => {
    e.preventDefault();
    if (!newQuerySubject || !newQueryMessage) return;
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: personalInfo.name, email: personalInfo.email, subject: newQuerySubject, message: newQueryMessage })
      });
      if (res.ok) {
        setNewQuerySubject('');
        setNewQueryMessage('');
        fetchPortalQueries();
      }
    } catch(e) {}
  };

  const handleClientReply = async (queryId) => {
    if (!clientReply.trim()) return;
    try {
      const res = await fetch('/api/portal/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_id: queryId, message: clientReply })
      });
      if (res.ok) {
        setClientReply('');
        setExpandedQueryId(null);
        fetchPortalQueries();
      }
    } catch(e) {}
  };

  // Check if this is a coming soon service page
  const comingSoonPage = comingSoonServices[module];

  if (comingSoonPage) {
    return (
      <div className="flex flex-col gap-6 anim-fade-in">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors self-start cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12 flex flex-col items-center justify-center text-center min-h-[400px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
              <svg className="w-10 h-10 md:w-12 md:h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={comingSoonPage.icon} />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-text-primary mb-3">{comingSoonPage.title}</h2>
            <div className="inline-flex items-center gap-2 bg-warning/10 text-warning px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Coming Soon
            </div>
            <p className="text-text-secondary text-sm md:text-base max-w-md leading-relaxed mb-8">
              {comingSoonPage.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/portal")}
                className="bg-primary text-white font-bold px-6 py-3 rounded-xl text-sm shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Back to Dashboard
              </button>
              <a
                href="/#queries"
                className="border border-gray-200 text-text-primary font-bold px-6 py-3 rounded-xl text-sm hover:bg-gray-50 transition-all text-center"
              >
                Request This Service
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (module === "queries") {
      return (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl font-bold text-text-primary">My Queries</h2>
          </div>

          {/* New Query Form */}
          <form onSubmit={handleAddQuery} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-sm text-text-primary">Submit New Query</h3>
            <input
              type="text"
              placeholder="Subject..."
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-primary"
              value={newQuerySubject}
              onChange={(e) => setNewQuerySubject(e.target.value)}
            />
            <textarea
              placeholder="Describe your question or request..."
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-primary resize-none min-h-[80px]"
              value={newQueryMessage}
              onChange={(e) => setNewQueryMessage(e.target.value)}
            />
            <button
              type="submit"
              className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer self-start"
            >
              Submit Query
            </button>
          </form>

          {/* Queries List */}
          {queriesLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : queries.length > 0 ? (
            <div className="flex flex-col gap-4">
              {queries.map((q) => (
                <div key={q.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-text-primary">{q.subject}</h4>
                      <p className="text-sm text-text-secondary mt-1">{q.message}</p>
                      <p className="text-xs text-text-secondary mt-2">{new Date(q.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${
                      q.status === 'replied' ? 'bg-green-100 text-green-700' : q.status === 'read' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {q.status}
                    </span>
                  </div>

                  {/* Replies */}
                  {q.replies && q.replies.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                      <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Conversation</h5>
                      {q.replies.map((r) => (
                        <div key={r.id} className={`p-3 rounded-xl text-sm ${r.sender_type === 'admin' ? 'bg-primary/5 border border-primary/10' : 'bg-gray-50 border border-gray-100'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.sender_type === 'admin' ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-700'}`}>
                              {r.sender_type === 'admin' ? 'Admin' : 'You'}
                            </span>
                            <span className="text-xs text-text-secondary">{new Date(r.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-text-primary">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {expandedQueryId === q.id ? (
                    <div className="mt-4 flex flex-col gap-2">
                      <textarea
                        placeholder="Type your reply..."
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-primary resize-none min-h-[60px]"
                        value={clientReply}
                        onChange={(e) => setClientReply(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleClientReply(q.id)} className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm cursor-pointer">Send</button>
                        <button onClick={() => { setExpandedQueryId(null); setClientReply(''); }} className="border border-gray-200 text-text-primary font-bold px-4 py-2 rounded-xl text-sm cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setExpandedQueryId(q.id)} className="mt-3 text-sm text-primary font-medium hover:underline cursor-pointer">Reply</button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
              <p className="text-text-secondary">No queries yet. Submit your first query above.</p>
            </div>
          )}
        </div>
      );
    }

    if (module === "settings") {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm max-w-2xl flex flex-col gap-6">
          <h2 className="text-xl font-bold text-text-primary">Profile & Security Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase">Full Name</label>
              <input
                type="text"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-primary focus:bg-white"
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase">Phone Number</label>
              <input
                type="text"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-primary focus:bg-white"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase">Email Address</label>
              <input
                type="email"
                disabled
                className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-text-secondary cursor-not-allowed"
                value={personalInfo.email}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase">CNIC</label>
              <input
                type="text"
                disabled
                className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-text-secondary cursor-not-allowed"
                value={personalInfo.cnic}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => router.back()}
              className="bg-white border border-gray-200 text-text-primary px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => alert("Settings saved (Simulated)")}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      );
    }

    // Default placeholder for unknown modules
    return (
      <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[350px]">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Coming Soon</h3>
        <p className="text-text-secondary max-w-sm text-sm">
          The {moduleName} page is currently under development and will be available soon.
        </p>
        <button
          onClick={() => router.push("/portal")}
          className="mt-6 bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 anim-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold capitalize text-text-primary">{moduleName}</h1>
        <p className="text-text-secondary mt-1 text-sm">View details and manage your {moduleName}.</p>
      </div>
      {renderContent()}
    </div>
  );
}
