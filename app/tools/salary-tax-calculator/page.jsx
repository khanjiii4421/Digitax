import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import SalaryTaxCalculatorClient from "./SalaryTaxCalculatorClient";
import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await db.all("SELECT * FROM settings");
  const siteTitle = settings.find((s) => s.key === "site_title")?.value || "DIGITAX";
  return {
    title: `Salary Tax Calculator Pakistan (2025–2026) | ${siteTitle}`,
    description:
      "Calculate your monthly and annual salary income tax in Pakistan based on the latest FBR tax slabs. Free, accurate, instant tax calculation with complete progressive slab breakdown.",
  };
}

const SALARY_FAQS = [
  {
    q: "What is the minimum taxable salary in Pakistan for Tax Year 2025–2026?",
    a: "Under the current FBR tax slabs, annual salary income up to PKR 600,000 (PKR 50,000 per month) is completely tax-exempt (0% tax). If your annual earnings exceed PKR 600,000, tax is calculated progressively on the amount exceeding PKR 600,000.",
  },
  {
    q: "How does my employer deduct salary tax (Section 149)?",
    a: "Under Section 149 of the Income Tax Ordinance 2001, your employer is legally required to estimate your annual taxable salary, calculate the total annual tax payable under the applicable FBR slabs, and deduct one-twelfth (1/12th) of that tax amount from your salary each month as withholding tax.",
  },
  {
    q: "What are the benefits of becoming an Active Taxpayer (ATL)?",
    a: "Being on the FBR Active Taxpayers List (ATL) entitles you to 50% lower withholding tax on banking transactions, cash withdrawals, car purchases, property registration, and token tax. It also protects you from severe non-filer penalties, utility disconnections, and travel restrictions.",
  },
  {
    q: "Can I adjust taxes deducted on my mobile phone, vehicle, or electricity bills?",
    a: "Yes! Any advance withholding tax deducted on your mobile phone bills, internet, electricity bills, vehicle token tax, or school fees can be adjusted against your annual salary tax liability when you file your annual income tax return with DIGITAX, potentially resulting in a tax refund.",
  },
  {
    q: "What documents do I need to file my annual salary tax return?",
    a: "To file your return, you need your CNIC, annual salary certificate from your employer (Form 149 or tax deduction certificate), bank account statement (July 1 to June 30), and records of any personal assets or tax deductions on mobile and utility bills.",
  },
];

export default async function SalaryTaxCalculatorPage() {
  const [settings, taxSlabs] = await Promise.all([
    db.all("SELECT * FROM settings"),
    db.all("SELECT * FROM tax_slabs ORDER BY tax_year DESC, salary_from ASC"),
  ]);

  const siteLogo = settings.find((s) => s.key === "site_logo")?.value;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = verifyToken(token);

  return (
    <main className="min-h-screen bg-gray-50/50 text-text-primary flex flex-col justify-between">
      <div>
        <AnnouncementBar settings={settings} />
        <Header logoUrl={siteLogo} initialUser={user} settings={settings} />

        {/* Hero Header Section */}
        <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary-dark text-white py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto max-w-6xl w-[90%] relative z-10 text-center">
            {/* Breadcrumb */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span>Tools</span>
              <span>/</span>
              <span className="text-white">Salary Tax Calculator</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              Pakistan Salary Tax Calculator
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-normal leading-relaxed">
              Calculate your monthly & annual salary income tax for <strong>Tax Year 2025–2026</strong> and previous years based on official FBR progressive tax slabs.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs md:text-sm font-semibold text-white/90">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <svg className="w-4 h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                FBR Slabs 2025–2026 Updated
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <svg className="w-4 h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                100% Free & Accurate
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <svg className="w-4 h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Full Slab Breakdown
              </div>
            </div>
          </div>
        </section>

        {/* Main Calculator Interactive Area */}
        <section className="py-12 md:py-20 -mt-10 relative z-20">
          <div className="mx-auto max-w-6xl w-[90%]">
            <SalaryTaxCalculatorClient slabs={taxSlabs} />
          </div>
        </section>

        {/* Informational Guide Section */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="mx-auto max-w-6xl w-[90%]">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-primary text-xs font-bold uppercase tracking-wider bg-primary/10 px-3.5 py-1 rounded-full">
                Tax Compliance Guide
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
                Understanding Salary Income Tax in Pakistan
              </h2>
              <p className="text-gray-500 text-sm md:text-base">
                Everything salaried individuals need to know about FBR taxation, tax deductions, and filing income tax returns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50/70 border border-gray-100 rounded-3xl p-8 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-primary flex items-center justify-center font-bold text-xl mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Who Must File?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Every salaried person earning more than PKR 600,000 annually is legally required to file an annual income tax return with the FBR, even if full tax was deducted by the employer.
                </p>
              </div>

              <div className="bg-gray-50/70 border border-gray-100 rounded-3xl p-8 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Claim Tax Refunds</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  You can claim tax credits for donations to approved non-profits, investment in mutual funds, health insurance, and adjust advance taxes already deducted on cell phone and utility bills.
                </p>
              </div>

              <div className="bg-gray-50/70 border border-gray-100 rounded-3xl p-8 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Active Taxpayer Benefits</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Staying on the Active Taxpayer List (ATL) shields you from exorbitant non-filer withholding rates when purchasing cars, buying or selling property, and withdrawing cash.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="py-16 md:py-20 bg-gray-50/60 border-t border-gray-200/60">
          <div className="mx-auto max-w-4xl w-[90%]">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Frequently Asked Questions (Salary Tax)
              </h2>
              <p className="text-gray-500 text-sm">
                Clear answers to common questions regarding salary tax in Pakistan.
              </p>
            </div>

            <div className="space-y-4">
              {SALARY_FAQS.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm transition-all open:shadow-md cursor-pointer"
                >
                  <summary className="font-bold text-base md:text-lg text-gray-900 list-none flex items-center justify-between gap-4">
                    <span>{faq.q}</span>
                    <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-open:rotate-180 transition-transform shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed mt-4 pt-4 border-t border-gray-100">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer settings={settings} />
    </main>
  );
}
