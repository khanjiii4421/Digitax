import Header from "@/components/Header";
import Footer from "@/components/Footer";
import db from "@/lib/db";
import Link from "next/link";

export const dynamic = 'force-dynamic';

function toSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function generateMetadata({ params }) {
  const services = await db.all('SELECT * FROM services');
  const settings = await db.all("SELECT * FROM settings");
  const service = services.find(s => toSlug(s.title) === params.slug);
  if (!service) return { title: 'Service Not Found - DIGITAX' };
  const siteTitle = settings.find(s => s.key === 'site_title')?.value || 'DIGITAX';
  return { title: `${service.title} - ${siteTitle}`, description: service.description?.slice(0, 160) };
}

export default async function ServiceDetail({ params }) {
  const [services, categories, settings, testimonials] = await Promise.all([
    db.all('SELECT * FROM services'),
    db.all('SELECT * FROM service_categories'),
    db.all('SELECT * FROM settings'),
    db.all('SELECT * FROM testimonials'),
  ]);

  const service = services.find(s => toSlug(s.title) === params.slug);
  if (!service) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold">Service Not Found</div>;

  const category = categories.find(c => c.id === service.category_id);
  const relatedServices = services.filter(s => s.category_id === service.category_id && s.id !== service.id && s.status === 'active').slice(0, 4);
  const siteLogo = settings.find(s => s.key === 'site_logo')?.value;
  const whatsappSetting = settings.find(s => s.key === 'contact_phone')?.value || '923001234567';
  const cleanNumber = whatsappSetting.replace(/[^0-9]/g, '');

  return (
    <main className="min-h-screen bg-white text-text-primary">
      <Header logoUrl={siteLogo} settings={settings} />
      
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none" />
        <div className="mx-auto max-w-[1200px] w-[90%] py-24 md:py-32 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">{service.working_days || 'Standard'}</span>
                {category && <span className="bg-white/10 text-white/80 text-xs px-4 py-1.5 rounded-full">{category.name}</span>}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">{service.title}</h1>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8">{service.description}</p>
              <div className="flex flex-wrap gap-4">
                <a href={`https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Hi, I need assistance with ${service.title}.`)}`} target="_blank" rel="noopener noreferrer" className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-all inline-flex items-center gap-3 shadow-xl">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Chat on WhatsApp
                </a>
                <Link href="/login" className="bg-white/10 text-white border-2 border-white/30 font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all inline-flex items-center gap-3">
                  Apply Now
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-64 h-64 bg-white/10 rounded-[32px] flex items-center justify-center border border-white/20 backdrop-blur-sm">
                {service.icon_url ? (
                  <img src={service.icon_url} alt="" className="w-32 h-32 object-contain" />
                ) : (
                  <div className="text-white/60 text-7xl font-bold opacity-30">{service.title[0]}</div>
                )}
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
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <span className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                Overview
              </h2>
              <div className="prose prose-lg max-w-none text-text-secondary leading-relaxed">
                <p>{service.description}</p>
                <p className="mt-4">At DIGITAX, we provide expert assistance for {service.title.toLowerCase()} to ensure compliance with FBR regulations. Our team of certified tax professionals handles the entire process from document preparation to final submission.</p>
              </div>
            </section>

            {service.requirements && (
              <section>
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                  <span className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></span>
                  Required Documents
                </h2>
                <div className="bg-background-light rounded-[24px] p-8">
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.requirements.split('\n').filter(Boolean).map((req, idx) => (
                      <li key={idx} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                        <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0 font-bold text-sm">{idx + 1}</span>
                        <span className="text-text-secondary">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            <section>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <span className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></span>
                Benefits
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Expert guidance from certified tax professionals',
                  'Fast processing within 24-48 hours',
                  '100% FBR compliant filing',
                  'Digital document management',
                  'Real-time application tracking',
                  'Dedicated support team',
                  'Secure data handling',
                  'Competitive pricing',
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-background-light rounded-xl">
                    <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-text-secondary">{benefit}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <span className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                Processing Timeline
              </h2>
              <div className="relative pl-10 space-y-8">
                {['Submit Documents', 'Verification', 'Processing', 'FBR Submission', 'Acknowledgement', 'Completion'].map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-10 w-6 h-6 rounded-full border-4 flex items-center justify-center ${idx === 0 ? 'bg-primary border-primary' : 'bg-white border-primary/30'}`}>
                      {idx === 0 && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    {idx < 5 && <div className="absolute -left-[25px] top-6 bottom-0 w-0.5 bg-primary/10" />}
                    <div>
                      <h4 className="font-bold text-text-primary">{step}</h4>
                      <p className="text-sm text-text-secondary mt-1">Estimated: {(idx + 1) * 2} hours</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <span className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></span>
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {[
                  { q: `What is the process for ${service.title.toLowerCase()}?`, a: `Our team handles everything from document collection to FBR submission. Simply submit your documents and we take care of the rest.` },
                  { q: 'How long does it take?', a: `Standard processing takes ${service.working_days || '24-48 hours'} from document submission.` },
                  { q: 'What documents are required?', a: 'Required documents are listed above. Our team will guide you if anything additional is needed.' },
                  { q: 'Is my data secure?', a: 'Yes, we use enterprise-grade encryption and follow strict data protection protocols.' },
                  { q: 'Can I track my application?', a: 'Yes, you can track your application status in real-time through your client portal.' },
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
                <div className="text-4xl font-bold mb-6">{service.price || 'Contact Us'}</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-white/80"><svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Expert consultation included</li>
                  <li className="flex items-center gap-3 text-white/80"><svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Document verification</li>
                  <li className="flex items-center gap-3 text-white/80"><svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> FBR submission included</li>
                  <li className="flex items-center gap-3 text-white/80"><svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Tracking dashboard access</li>
                </ul>
                <Link href="/login" className="block w-full bg-white text-primary font-bold text-center py-4 rounded-xl hover:bg-white/90 transition-all">Apply Now</Link>
              </div>

              <a href={`https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Hi, I need assistance with ${service.title}.`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-[#25D366] text-white p-5 rounded-[20px] hover-scale">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div><div className="font-bold">Need Help?</div><div className="text-sm text-white/80">Chat on WhatsApp</div></div>
              </a>
            </div>
          </div>
        </div>

        {testimonials.length > 0 && (
          <section className="mt-20 pt-20 border-t border-premium">
            <h2 className="text-3xl font-bold mb-10 text-center">What Our Clients Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.slice(0, 3).map((t, idx) => (
                <div key={t.id} className="bg-background-light rounded-[24px] p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </div>
                  <p className="text-text-secondary mb-6 italic">"{t.review}"</p>
                  <div className="flex items-center gap-4">
                    {t.photo_url && <img src={t.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />}
                    <div><div className="font-bold">{t.name}</div><div className="text-sm text-text-secondary">{t.role}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedServices.length > 0 && (
          <section className="mt-20 pt-20 border-t border-premium">
            <h2 className="text-3xl font-bold mb-10">Related Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedServices.map(rs => (
                <Link key={rs.id} href={`/services/${toSlug(rs.title)}`} className="group bg-background-light rounded-[20px] p-6 hover:shadow-lg transition-all hover-scale">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all">{rs.title[0]}</div>
                  <h3 className="font-bold mb-2">{rs.title}</h3>
                  <p className="text-sm text-text-secondary line-clamp-2">{rs.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-20 pt-20 border-t border-premium">
          <div className="bg-gradient-to-br from-primary to-primary/90 rounded-[32px] p-12 md:p-20 text-white text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">Join thousands of satisfied clients who trust DIGITAX for their tax and business needs.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/login" className="bg-white text-primary font-bold px-10 py-4 rounded-xl hover:bg-white/90 transition-all text-lg">Apply Now</Link>
              <a href={`https://wa.me/${cleanNumber}`} target="_blank" rel="noopener noreferrer" className="bg-white/10 text-white border-2 border-white/30 font-bold px-10 py-4 rounded-xl hover:bg-white/20 transition-all text-lg inline-flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>

      <Footer settings={settings} />
    </main>
  );
}
