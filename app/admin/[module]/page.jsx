"use client";

import { useParams, useRouter } from "next/navigation";

export default function ComingSoonPage() {
  const params = useParams();
  const router = useRouter();
  const module = params.module || "";
  const moduleName = module.replace("-", " ");

  return (
    <div className="flex flex-col gap-6 anim-fade-in">
      <h1 className="text-3xl font-heading font-bold capitalize">{moduleName}</h1>
      
      <div className="bg-white p-12 rounded-[24px] border border-premium shadow-premium flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2 text-text-primary">Coming Soon</h3>
        <p className="text-text-secondary max-w-md text-sm">
          The {moduleName} management module is currently under development. Please check back later.
        </p>
        <button 
          className="mt-8 bg-primary text-white px-8 py-3 rounded-xl font-medium shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer text-sm" 
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
