"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

export default function AdminPage() {
  const { showToast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [stats, setStats] = useState({
    usersCount: 0,
    servicesCount: 0,
    queriesCount: 0,
    slabsCount: 0,
    videosCount: 0,
    teamCount: 0,
    testimonialsCount: 0,
    recentQueries: [],
  });

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth/me");
      const resData = await res.json();
      if (res.ok && resData.success) {
        setIsAdmin(true);
        fetchStats();
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      setIsAdmin(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      showToast("Error loading stats.", "error");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return showToast("Please fill in all fields.", "error");
    }
    setLoginSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Welcome Admin!", "success");
        window.location.href = "/admin";
      } else {
        showToast(data.message || "Invalid credentials.", "error");
      }
    } catch (err) {
      showToast("Authentication failed.", "error");
    } finally {
      setLoginSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white border border-premium shadow-premium rounded-[24px] w-full max-w-md p-10 relative anim-fade-in">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4 text-xl">
              D
            </div>
            <h2 className="text-3xl font-heading font-bold text-text-primary tracking-tight">Admin Portal</h2>
            <p className="text-text-secondary mt-1 text-sm">Secure sign-in for DIGITAX administration</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-text-primary ml-1">Email Address</label>
              <input
                type="email"
                placeholder="admin@digitax.pk"
                required
                className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-text-primary ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="bg-primary text-white font-bold text-base py-3.5 rounded-xl mt-2 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-primary/30 transition-all cursor-pointer"
            >
              {loginSubmitting ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 anim-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Dashboard Overview</h1>
        <p className="text-text-secondary text-sm">Manage and customize your DIGITAX platform.</p>
      </div>

      {statsLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Users", value: stats.usersCount, color: "text-blue-600", bg: "bg-blue-50/50" },
              { label: "Active Services", value: stats.servicesCount, color: "text-green-600", bg: "bg-green-50/50" },
              { label: "Sales Queries", value: stats.queriesCount, color: "text-orange-600", bg: "bg-orange-50/50" },
              { label: "Tax Slabs", value: stats.slabsCount, color: "text-teal-600", bg: "bg-teal-50/50" },
              { label: "YouTube Videos", value: stats.videosCount, color: "text-purple-600", bg: "bg-purple-50/50" },
              { label: "Team Members", value: stats.teamCount, color: "text-indigo-600", bg: "bg-indigo-50/50" },
              { label: "Testimonials", value: stats.testimonialsCount, color: "text-pink-600", bg: "bg-pink-50/50" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-[20px] border border-gray-200/60 shadow-sm hover:scale-[1.02] transition-all flex flex-col justify-between h-32 bg-white"
              >
                <h3 className="text-text-secondary font-medium text-sm">{stat.label}</h3>
                <div className={`mt-auto text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[20px] p-6 border border-gray-200/60 shadow-sm">
            <h2 className="font-bold text-lg text-text-primary mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <a
                href="/admin/settings?tab=services"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
              >
                + Add New Service
              </a>
              <a
                href="/admin/settings?tab=tax-slabs"
                className="bg-white border border-gray-200 text-text-primary hover:bg-gray-50 font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Manage Tax Slabs
              </a>
              <a
                href="/admin/settings"
                className="bg-white border border-gray-200 text-text-primary hover:bg-gray-50 font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Edit Site settings
              </a>
              <a
                href="/admin/settings?tab=queries"
                className="bg-white border border-gray-200 text-text-primary hover:bg-gray-50 font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
              >
                View Queries
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[20px] border border-gray-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-lg text-text-primary">Recent Queries</h2>
                <a href="/admin/queries" className="text-primary text-sm font-medium hover:underline">
                  View All
                </a>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-text-secondary text-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Subject</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.recentQueries.length > 0 ? (
                      stats.recentQueries.map((query) => (
                        <tr key={query.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-text-primary">{query.name}</td>
                          <td className="px-6 py-4 text-text-secondary truncate max-w-[150px]">
                            {query.subject}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                query.status === "unread" ? "bg-error/10 text-error" : "bg-success/10 text-success"
                              }`}
                            >
                              {query.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-text-secondary">
                          No queries found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-gray-200/60 shadow-sm p-6">
              <h2 className="font-bold text-lg text-text-primary mb-4">Activity Log</h2>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-start py-3 border-b border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-success mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-primary">System initialized</p>
                    <p className="text-xs text-text-secondary">SQLite tables and seeded admin verified.</p>
                  </div>
                  <span className="text-xs text-text-secondary">Active</span>
                </div>
                <div className="flex gap-4 items-start py-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-primary">Admin authenticated</p>
                    <p className="text-xs text-text-secondary">Secure cookie verification system active.</p>
                  </div>
                  <span className="text-xs text-text-secondary">Active</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
