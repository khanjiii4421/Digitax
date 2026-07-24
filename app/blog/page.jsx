import Header from "@/components/Header";
import Footer from "@/components/Footer";
import db from "@/lib/db";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await db.all("SELECT * FROM settings");
  const siteTitle = settings.find(s => s.key === 'site_title')?.value || 'DIGITAX';
  return { title: `Blog - ${siteTitle}`, description: 'Expert insights on tax filing, NTN registration, FBR compliance and business registration in Pakistan.' };
}

export default async function BlogPage() {
  const [blogs, settings] = await Promise.all([
    db.all('SELECT * FROM blogs ORDER BY display_order ASC'),
    db.all('SELECT * FROM settings'),
  ]);

  const siteLogo = settings.find(s => s.key === 'site_logo')?.value;

  return (
    <main className="min-h-screen bg-white text-text-primary">
      <Header logoUrl={siteLogo} settings={settings} />

      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white">
        <div className="mx-auto max-w-[1200px] w-[90%] py-24 md:py-32">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Blog</h1>
          <p className="text-xl text-white/80 max-w-2xl">Expert insights, guides and updates on tax filing, business registration and FBR compliance in Pakistan.</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] w-[90%] py-20">
        {blogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-background-light rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">No Articles Yet</h2>
            <p className="text-text-secondary">Check back soon for updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map(blog => (
              <Link key={blog.id} href={`/blog/${blog.id}`} className="group bg-white rounded-[24px] overflow-hidden border border-premium shadow-premium hover-scale">
                {blog.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-8">
                  <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{blog.title}</h2>
                  <p className="text-text-secondary line-clamp-3 mb-6">{blog.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-medium text-sm">Read More</span>
                    <svg className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer settings={settings} />
    </main>
  );
}
