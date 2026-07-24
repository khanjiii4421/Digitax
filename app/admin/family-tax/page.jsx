"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminFamilyTaxPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState(null);
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchApplications = () => {
    setLoading(true);
    const query = new URLSearchParams({
      status: statusFilter,
      paymentStatus: paymentFilter,
      search
    });

    fetch(`/api/admin/family-tax?${query.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApplications(data.data);
          setCounts(data.counts);
        } else {
          console.error("Failed to load applications:", data.error || "Unknown error");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, paymentFilter]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Draft': return 'bg-gray-100 text-gray-700';
      case 'Payment Pending': return 'bg-amber-100 text-amber-700';
      case 'Payment Verification': return 'bg-orange-100 text-orange-700';
      case 'Under Review': return 'bg-blue-100 text-blue-700';
      case 'Processing': return 'bg-indigo-100 text-indigo-700';
      case 'FBR Submitted': return 'bg-purple-100 text-purple-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusBadge = (status) => {
    if (status === 'Payment Verified') return 'bg-green-100 text-green-700';
    if (status === 'Payment Verification Pending') return 'bg-orange-100 text-orange-700';
    if (status === 'Pending Payment') return 'bg-amber-100 text-amber-700';
    if (status === 'Rejected') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Tax Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and process submitted family tax applications.</p>
        </div>
      </div>

      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-bold uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
            <p className="text-xs text-amber-600 font-bold uppercase">Unpaid</p>
            <p className="text-2xl font-bold text-gray-900">{counts.pendingPayment}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm">
            <p className="text-xs text-orange-600 font-bold uppercase">Verify Payment</p>
            <p className="text-2xl font-bold text-gray-900">{counts.verificationPending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
            <p className="text-xs text-blue-600 font-bold uppercase">In Process</p>
            <p className="text-2xl font-bold text-gray-900">{counts.verified}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
            <p className="text-xs text-green-600 font-bold uppercase">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{counts.completed}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-t-xl border border-b-0 border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All App Statuses</option>
            <option value="Payment Pending">Payment Pending</option>
            <option value="Payment Verification">Payment Verification</option>
            <option value="Under Review">Under Review</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
          </select>
          <select 
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            <option value="Pending Payment">Pending Payment</option>
            <option value="Payment Verification Pending">Verification Pending</option>
            <option value="Payment Verified">Payment Verified</option>
          </select>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search by Order, Name, CNIC..." 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchApplications()}
          />
          <button 
            onClick={fetchApplications}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition"
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-b-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 font-bold">Order #</th>
              <th className="px-6 py-4 font-bold">Applicant</th>
              <th className="px-6 py-4 font-bold">Date</th>
              <th className="px-6 py-4 font-bold">Payment</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">Loading applications...</td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">No applications found matching your criteria.</td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">#{app.order_number}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{app.full_name}</p>
                    <p className="text-xs text-gray-500">{app.cnic}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getPaymentStatusBadge(app.payment_status)}`}>
                      {app.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/family-tax/${app.id}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors"
                    >
                      View & Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
