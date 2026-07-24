import Header from "@/components/Header";
import Footer from "@/components/Footer";
import db from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

const validYears = ['2017','2018','2019','2020','2021','2022','2023','2024','2025','2026'];

const yearDetails = {
  '2026': { fee: '0 - 600,000', slab: '5% to 35%', label: 'Current Tax Year', documents: ['CNIC (Original)', 'Last Year Tax Return', 'Salary Slips (last 12 months)', 'Bank Statements', 'Property Details', 'Utility Bills'] },
  '2025': { fee: '0 - 600,000', slab: '5% to 35%', label: 'Belated Return', documents: ['CNIC (Original)', 'Last Year Tax Return', 'Salary Slips (last 12 months)', 'Bank Statements', 'Property Details'] },
  '2024': { fee: '0 - 600,000', slab: '5% to 35%', label: 'Belated Return', documents: ['CNIC (Original)', 'Last Year Tax Return', 'Salary Slips', 'Bank Statements', 'Property Details'] },
  '2023': { fee: '0 - 400,000', slab: '2.5% to 35%', label: 'Belated Return', documents: ['CNIC (Original)', 'Bank Statements', 'Property Details', 'Previous Tax Return'] },
  '2022': { fee: '0 - 400,000', slab: '2.5% to 35%', label: 'Belated Return', documents: ['CNIC (Original)', 'Bank Statements', 'Property Details', 'Previous Tax Return'] },
  '2021': { fee: '0 - 400,000', slab: '2.5% to 35%', label: 'Belated Return', documents: ['CNIC (Original)', 'Bank Statements', 'Property Details'] },
  '2020': { fee: '0 - 400,000', slab: '2.5% to 30%', label: 'Belated Return', documents: ['CNIC (Original)', 'Bank Statements', 'Property Details'] },
  '2019': { fee: '0 - 400,000', slab: '2.5% to 30%', label: 'Belated Return', documents: ['CNIC (Original)', 'Bank Statements', 'Property Details'] },
  '2018': { fee: '0 - 400,000', slab: '2.5% to 30%', label: 'Belated Return', documents: ['CNIC (Original)', 'Bank Statements', 'Property Details'] },
  '2017': { fee: '0 - 400,000', slab: '2.5% to 30%', label: 'Belated Return', documents: ['CNIC (Original)', 'Bank Statements', 'Property Details'] },
};

export async function generateMetadata({ params }) {
  const settings = await db.all("SELECT * FROM settings");
  const siteTitle = settings.find(s => s.key === 'site_title')?.value || 'DIGITAX';
  if (!validYears.includes(params.year)) return { title: 'Not Found - DIGITAX' };
  return { title: `Tax Year ${params.year} - ${siteTitle}`, description: `File your income tax return for tax year ${params.year} with DIGITAX. Expert assistance, fast processing, and FBR compliant filing.` };
}

export default async function TaxYearPage({ params }) {
  const [services, settings, testimonials] = await Promise.all([
    db.all('SELECT * FROM services'),
    db.all('SELECT * FROM settings'),
    db.all('SELECT * FROM testimonials'),
  ]);

  if (!validYears.includes(params.year)) notFound();

  const siteLogo = settings.find(s => s.key === 'site_logo')?.value;
  const details = yearDetails[params.year];
  const taxServices = services.filter(s => s.status === 'active').slice(0, 4);

  return (
    <main className="min-h-screen bg-white text-text-primary">
      <Header logoUrl={siteLogo} settings={settings} />

      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none" />
        <div className="mx-auto max-w-[1200px] w-[90%] py-24 md:py-32 relative z-10">
          <Link href="/tax-years" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
            All Tax Years
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">Tax Year {params.year}</span>
                <span className="bg-white/10 text-white/80 text-xs px-4 py-1.5 rounded-full">{details.label}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">File Your Return for Tax Year {params.year}</h1>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8">Professional assistance for filing your income tax return for tax year {params.year}. Get expert guidance, document verification, and FBR-compliant filing.</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/login" className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-all">Apply Now</Link>
                <Link href="/services" className="bg-white/10 text-white border-2 border-white/30 font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all">View Services</Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-48 h-48 bg-white/10 rounded-[32px] flex items-center justify-center border border-white/20 backdrop-blur-sm">
                <span className="text-white/30 text-8xl font-black">{params.year.slice(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </section>

      <div className="mx-auto max-w-[1200px] w-[90%] py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-16">
            <section>
              <h2 className="text-3xl font-bold mb-8">Overview</h2>
              <p className="text-text-secondary leading-relaxed">
                Filing your income tax return for Tax Year {params.year} is essential for compliance with FBR regulations. 
                Whether you are a salaried individual, business owner, freelancer, or AOP, DIGITAX provides expert assistance 
                to ensure accurate and timely filing. Our team of certified tax professionals handles everything from 
                document preparation to final submission.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-8">Required Documents</h2>
              <div className="bg-background-light rounded-[24px] p-8">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {details.documents.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0 font-bold text-sm">{idx + 1}</span>
                      <span className="text-text-secondary">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-8">Tax Slabs for {params.year}</h2>
              <div className="bg-background-light rounded-[24px] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="text-left p-4 font-bold">Salary Range</th>
                      <th className="text-left p-4 font-bold">Tax Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[{from: 0, to: '600,000', rate: '0%'},{from: '600,001', to: '1,200,000', rate: '5%'},{from: '1,200,001', to: '2,200,000', rate: '15%'},{from: '2,200,001', to: '3,200,000', rate: '25%'},{from: '3,200,001', to: '4,100,000', rate: '30%'},{from: '4,100,001', to: 'Above', rate: '35%'}].map((row, idx) => (
                      <tr key={idx} className="border-t border-premium">
                        <td className="p-4 text-text-secondary">Rs. {row.from} - {row.to}</td>
                        <td className="p-4 font-bold text-text-primary">{row.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-8">FAQs</h2>
              <div className="space-y-4">
                {[
                  { q: `Can I still file my return for Tax Year ${params.year}?`, a: `Yes, you can file a belated return for Tax Year ${params.year}. Our team will guide you through the process.` },
                  { q: 'What is the deadline?', a: 'The standard deadline is September 30th each year. Belated returns can be filed with applicable penalties.' },
                  { q: 'What if I have no income?', a: 'Even with nil income, filing a return is recommended to maintain your tax profile and avoid notices.' },
                  { q: 'How long does the process take?', a: 'With complete documents, we process your return within 24-48 hours.' },
                ].map((faq, idx) => (
                  <details key={idx} className="group bg-background-light rounded-2xl overflow-hidden">
                    <summary className="p-5 font-bold cursor-pointer list-none flex items-center justify-between hover:bg-primary/5 transition-colors">
                      {faq.q}
                      <svg className="w-5 h-5 text-text-secondary group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </summary>
                    <div className="px-5 pb-5 text-text-secondary leading-relaxed">{faq.a}</div>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-gradient-to-br from-primary to-primary/90 text-white rounded-[24px] p-8 shadow-xl">
                <h3 className="text-2xl font-bold mb-2">Pricing</h3>
                <div className="text-sm text-white/70 mb-1">Government Fee</div>
                <div className="text-3xl font-bold mb-6">{details.fee}</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-white/80"><svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Document verification</li>
                  <li className="flex items-center gap-3 text-white/80"><svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> FBR submission included</li>
                  <li className="flex items-center gap-3 text-white/80"><svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Real-time tracking</li>
                  <li className="flex items-center gap-3 text-white/80"><svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Expert consultation</li>
                </ul>
                <Link href="/login" className="block w-full bg-white text-primary font-bold text-center py-4 rounded-xl hover:bg-white/90 transition-all">Apply Now</Link>
              </div>

              <div className="bg-background-light rounded-[24px] p-8">
                <h3 className="font-bold mb-4">Related Services</h3>
                <div className="space-y-3">
                  <Link href="/services" className="block p-3 rounded-xl hover:bg-white transition-all text-text-secondary hover:text-primary text-sm">Personal Tax Return</Link>
                  <Link href="/services" className="block p-3 rounded-xl hover:bg-white transition-all text-text-secondary hover:text-primary text-sm">Business Tax Return</Link>
                  <Link href="/services" className="block p-3 rounded-xl hover:bg-white transition-all text-text-secondary hover:text-primary text-sm">NTN Registration</Link>
                  <Link href="/services" className="block p-3 rounded-xl hover:bg-white transition-all text-text-secondary hover:text-primary text-sm">ATL Restoration</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer settings={settings} />
    </main>
  );
}
