import Header from "@/components/Header";
import Footer from "@/components/Footer";
import db from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const [settings, blogs] = await Promise.all([
    db.all("SELECT * FROM settings"),
    db.all('SELECT * FROM blogs'),
  ]);
  const blog = blogs.find(b => String(b.id) === params.slug);
  if (!blog) return { title: 'Not Found - DIGITAX' };
  const siteTitle = settings.find(s => s.key === 'site_title')?.value || 'DIGITAX';
  return { title: `${blog.title} - ${siteTitle}`, description: blog.description?.slice(0, 160) };
}

export default async function BlogPost({ params }) {
  const [blogs, settings] = await Promise.all([
    db.all('SELECT * FROM blogs'),
    db.all('SELECT * FROM settings'),
  ]);

  const blog = blogs.find(b => String(b.id) === params.slug);
  if (!blog) notFound();

  const siteLogo = settings.find(s => s.key === 'site_logo')?.value;
  const siteTitle = settings.find(s => s.key === 'site_title')?.value || 'DIGITAX';

  return (
    <main className="min-h-screen bg-white text-text-primary">
      <Header logoUrl={siteLogo} settings={settings} />

      <article className="mx-auto max-w-[800px] w-[90%] py-20">
        <Link href="/blog" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-12 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          Back to Blog
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold mb-6">{blog.title}</h1>

        {blog.image_url && (
          <div className="rounded-[24px] overflow-hidden mb-12">
            <img src={blog.image_url} alt={blog.title} className="w-full h-auto" />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-text-secondary leading-relaxed">
          {blog.description?.split('\n').map((para, idx) => (
            <p key={idx} className="mb-6">{para}</p>
          ))}
          <p className="mt-8 text-text-secondary">
            For professional assistance with your tax and business needs,{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">contact DIGITAX today</Link>.
          </p>
        </div>

        <div className="mt-16 pt-12 border-t border-premium">
          <Link href="/services" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-xl hover-scale">
            Explore Our Services
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </article>

      <Footer settings={settings} />
    </main>
  );
}
