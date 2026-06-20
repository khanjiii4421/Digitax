import Header from "@/components/Header";
import Footer from "@/components/Footer";
import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import Link from "next/link";
import SalesTaxForm from "@/components/sections/SalesTaxForm";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Sales Tax Registration & Filing | DIGITAX Pakistan",
  description:
    "Register for GST/Sales Tax in Pakistan, file monthly returns, and stay compliant with FBR regulations. Expert sales tax consultants at your service.",
};

const STEPS = [
  { step: "01", title: "Consultation", desc: "Free initial consultation to assess your sales tax obligations and business category." },
  { step: "02", title: "Documentation", desc: "We gather all required documents including CNIC, NTN, business details and bank statements." },
  { step: "03", title: "Application", desc: "Our team files your sales tax registration application directly through FBR's IRIS portal." },
  { step: "04", title: "Certificate Issued", desc: "You receive your official Sales Tax Registration Certificate within 3–7 working days." },
];

const FAQS = [
  {
    q: "Who is required to register for Sales Tax?",
    a: "Any business whose annual turnover exceeds PKR 10 million, or that imports/exports goods, or is a manufacturer or supplier of taxable goods must register for Sales Tax under the Sales Tax Act, 1990.",
  },
  {
    q: "What is the current standard Sales Tax rate?",
    a: "The standard GST rate in Pakistan is 18% on taxable supplies of goods. Different rates apply to specific categories including 1%, 3%, 5%, and reduced rates for certain food items and essential goods.",
  },
  {
    q: "How often do I need to file Sales Tax returns?",
    a: "Sales Tax returns must be filed monthly. The deadline is the 18th of the following month. Late filing attracts a penalty of PKR 10,000 or 5% of the tax due, whichever is higher.",
  },
  {
    q: "Can I claim input tax adjustment?",
    a: "Yes. If you are a registered taxpayer and you purchase goods or services from another registered person, you can claim the input tax paid against your output tax liability.",
  },
  {
    q: "How long does registration take?",
    a: "With complete documentation, sales tax registration through IRIS typically takes 3 to 7 working days. Our team expedites the process by ensuring all documents are correctly submitted.",
  },
];

const SLABS = [
  { category: "General Goods", rate: "18%", notes: "Standard rate for most taxable goods" },
  { category: "Services (Federal)", rate: "15–16%", notes: "Varies by province and service type" },
  { category: "Petroleum Products", rate: "17%", notes: "Petroleum Levy applies separately" },
  { category: "Food Items (Restaurants)", rate: "15%", notes: "For sales tax registered restaurants" },
  { category: "Export of Goods", rate: "0%", notes: "Zero-rated — input tax refundable" },
  { category: "IT/Software Services", rate: "0%", notes: "Exempt for registered IT exporters" },
];

export default async function SalesTaxPage() {
  const settings = await db.all("SELECT * FROM settings");
  const siteLogo = settings.find((s) => s.key === "site_logo")?.value;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = verifyToken(token);

  const whatsapp = settings.find((s) => s.key === "whatsapp_number")?.value || "923001234567";

  return (
    <main className="min-h-screen bg-white text-text-primary overflow-x-hidden pt-4">
      <Header logoUrl={siteLogo} initialUser={user} />

      {/* Hero */}
      <section className="bg-primary text-white pt-36 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-[1400px] w-[90%]">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-full mb-8">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                FBR Registered Consultants
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Sales Tax Registration <br />
                <span className="text-yellow-300">&amp; Filing Services</span>
              </h1>
              <p className="text-white/80 text-lg max-w-xl leading-relaxed mb-10">
                Get your business GST/Sales Tax registered with FBR. We handle the entire process — from documentation to certificate — and keep you compliant every month.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="bg-white text-primary font-bold px-8 py-4 rounded-2xl hover:bg-yellow-300 hover:text-primary transition-colors duration-200 shadow-xl"
                >
                  Get Started Today
                </Link>
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi, I need help with Sales Tax Registration.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#1da851] transition-colors duration-200 shadow-xl flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp Us
                </a>
              </div>
            </div>

            <div className="flex-shrink-0 grid grid-cols-2 gap-4">
              {[
                { label: "Registrations Completed", value: "2,400+" },
                { label: "FBR Compliance Rate", value: "99.8%" },
                { label: "Avg. Processing Time", value: "5 Days" },
                { label: "Happy Clients", value: "1,800+" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <div className="text-3xl font-bold text-yellow-300">{stat.value}</div>
                  <div className="text-white/70 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background-light">
        <div className="mx-auto max-w-[1400px] w-[90%]">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              A simple, transparent 4-step process from start to certificate.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative bg-white rounded-[20px] p-8 border border-premium shadow-premium flex flex-col gap-4">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 -right-4 z-10">
                    <svg className="w-8 h-8 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">{s.step}</span>
                </div>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tax Rates Table */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-[1400px] w-[90%]">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pakistan Sales Tax Rates</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Current rates applicable under the Sales Tax Act, 1990 and Finance Acts.
            </p>
          </div>
          <div className="overflow-x-auto rounded-[20px] border border-premium shadow-premium">
            <table className="w-full min-w-[640px]">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="text-left px-8 py-5 text-sm font-semibold tracking-wide">Category</th>
                  <th className="text-center px-8 py-5 text-sm font-semibold tracking-wide">Rate</th>
                  <th className="text-left px-8 py-5 text-sm font-semibold tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody>
                {SLABS.map((row, idx) => (
                  <tr key={row.category} className={idx % 2 === 0 ? "bg-white" : "bg-background-light"}>
                    <td className="px-8 py-5 font-medium text-text-primary">{row.category}</td>
                    <td className="px-8 py-5 text-center">
                      <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full text-sm">{row.rate}</span>
                    </td>
                    <td className="px-8 py-5 text-text-secondary text-sm">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-text-secondary text-xs mt-4">
            Rates are subject to change per annual Finance Acts. Last updated FY 2024–25.
          </p>
        </div>
      </section>

      {/* Lead Capture Form */}
      <SalesTaxForm />

      {/* FAQ */}
      <section className="py-24 bg-background-light">
        <div className="mx-auto max-w-[1400px] w-[90%]">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Everything you need to know about Sales Tax in Pakistan.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-white rounded-[20px] p-8 border border-premium shadow-premium">
                <h3 className="font-bold text-lg mb-3 flex items-start gap-3">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {faq.q}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed pl-9">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-white">
        <div className="mx-auto max-w-[1400px] w-[90%] text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Registered?</h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto mb-10">
            Let our experts handle your Sales Tax registration and monthly filings so you can focus on growing your business.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-primary font-bold px-10 py-4 rounded-2xl hover:bg-yellow-300 transition-colors duration-200 shadow-xl"
            >
              Start Registration
            </Link>
            <Link
              href="/services"
              className="border-2 border-white/50 text-white font-bold px-10 py-4 rounded-2xl hover:bg-white/10 transition-colors duration-200"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </main>
  );
}
