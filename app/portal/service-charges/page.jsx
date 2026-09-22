"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ServiceChargesPage() {
  const [pricingList, setPricingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/service-pricing")
      .then(r => r.json())
      .then(d => {
        if (d.success) setPricingList(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20 anim-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Official Service Rates & Schedule of Charges</h1>
        <p className="text-text-secondary text-sm mt-1">Transparent, government fee breakdown and DigiTax professional consultancy charges.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pricingList.map(item => (
            <div key={item.service_key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg text-text-primary">{item.service_name}</h3>
                  <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs shrink-0">
                    {item.currency} {parseFloat(item.total_fee).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mb-4">{item.description || "Official service filing & legal assistance."}</p>
                
                <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Government / SECP Fee:</span>
                    <span className="font-medium text-gray-900">{item.currency} {parseFloat(item.government_fee).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>DigiTax Professional Fee:</span>
                    <span className="font-medium text-gray-900">{item.currency} {parseFloat(item.digitax_fee).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-primary">
                    <span>Total Inclusive:</span>
                    <span>{item.currency} {parseFloat(item.total_fee).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href={`/portal/${item.service_key === 'personal-tax' ? 'personal-tax' : item.service_key === 'family-tax' ? 'family-tax' : item.service_key === 'ntn-registration' ? 'ntn-registration' : item.service_key === 'iris-profile' ? 'iris-profile' : item.service_key === 'business-registration' ? 'business-registration' : item.service_key === 'gst-registration' ? 'gst-registration' : 'services'}`}
                  className="w-full block text-center bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Apply Now →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
