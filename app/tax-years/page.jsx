import Header from "@/components/Header";
import Footer from "@/components/Footer";
import db from "@/lib/db";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await db.all("SELECT * FROM settings");
  const siteTitle = settings.find(s => s.key === 'site_title')?.value || 'DIGITAX';
  return { title: `Tax Return Years - ${siteTitle}`, description: 'File your tax returns for all tax years from 2017 to 2026. Expert assistance for salaried, business, freelancer and individual tax returns.' };
}

export default async function TaxYearsPage() {
  const [taxSlabs, settings] = await Promise.all([
    db.all('SELECT DISTINCT tax_year FROM tax_slabs ORDER BY tax_year DESC'),
    db.all('SELECT * FROM settings'),
  ]);

  const siteLogo = settings.find(s => s.key === 'site_logo')?.value;
  const years = taxSlabs.map(s => s.tax_year);

  const yearData = [
    { year: '2026', fee: '0 - 600,000', desc: 'Current tax year. File your income tax return for 2026.' },
    { year: '2025', fee: '0 - 600,000', desc: 'File your income tax return for tax year 2025.' },
    { year: '2024', fee: '0 - 600,000', desc: 'File your belated return for tax year 2024.' },
    { year: '2023', fee: '0 - 400,000', desc: 'File your belated return for tax year 2023.' },
    { year: '2022', fee: '0 - 400,000', desc: 'File your belated return for tax year 2022.' },
    { year: '2021', fee: '0 - 400,000', desc: 'File your belated return for tax year 2021.' },
    { year: '2020', fee: '0 - 400,000', desc: 'File your belated return for tax year 2020.' },
    { year: '2019', fee: '0 - 400,000', desc: 'File your belated return for tax year 2019.' },
    { year: '2018', fee: '0 - 400,000', desc: 'File your belated return for tax year 2018.' },
    { year: '2017', fee: '0 - 400,000', desc: 'File your belated return for tax year 2017.' },
  ];

  return (
    <main className="min-h-screen bg-white text-text-primary">
      <Header logoUrl={siteLogo} settings={settings} />

      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white">
        <div className="mx-auto max-w-[1200px] w-[90%] py-24 md:py-32">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Tax Return Years</h1>
          <p className="text-xl text-white/80 max-w-2xl">File your income tax returns for any tax year from 2017 to 2026 with expert assistance from DIGITAX.</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] w-[90%] py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {yearData.map(data => (
            <Link key={data.year} href={`/tax-years/${data.year}`} className="group bg-white rounded-[24px] p-8 border border-premium shadow-premium hover-scale hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-white font-bold text-2xl group-hover:scale-110 transition-transform">{data.year.slice(2)}</div>
                {data.year === '2026' && <span className="bg-success/10 text-success text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Current</span>}
              </div>
              <h3 className="text-2xl font-bold mb-2">Tax Year {data.year}</h3>
              <p className="text-text-secondary mb-6">{data.desc}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Govt. Fee: <span className="font-bold text-text-primary">{data.fee}</span></span>
                <span className="text-primary font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Apply Now <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer settings={settings} />
    </main>
  );
}
