"use client";

export default function BlogPosts({ blogs }) {
  const displayBlogs = blogs && blogs.length > 0 ? blogs : [
    { id: 1, title: 'How to File Your Taxes in 6 Minutes', description: 'Learn the quickest way to file your income tax return in Pakistan using our streamlined process.', link: '/services' },
    { id: 2, title: 'Company Registration in Pakistan: Complete Guide', description: 'Everything you need to know about registering a Private Limited Company — documents, timeline, and costs.', link: '/services' },
    { id: 3, title: 'Understanding Sales Tax for E-Commerce', description: 'A comprehensive guide to sales tax registration and monthly filing for online businesses in Pakistan.', link: '/sales-tax' },
    { id: 4, title: 'USA LLC Formation for Pakistani Entrepreneurs', description: 'How Pakistani freelancers and business owners can set up an LLC in the USA for international payments.', link: '/services' },
  ].slice(0, 4);

  const BLOG_ICONS = [
    <path key="b0" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    <path key="b1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    <path key="b2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />,
    <path key="b3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  ];

  return (
    <section className="py-20 bg-background-light">
      <div className="mx-auto max-w-[1400px] w-[90%] md:w-[75%]">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest from Our Blog</h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">Stay updated with the latest tax tips, business guides, and regulatory updates.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayBlogs.map((blog, idx) => (
            <a
              key={blog.id}
              href={blog.link || '#'}
              className="bg-white rounded-[1.5rem] border border-premium shadow-premium overflow-hidden group hover-scale block"
            >
              {blog.image_url ? (
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img
                    src={blog.image_url}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="relative aspect-[16/10] bg-primary/5 flex items-center justify-center overflow-hidden">
                  <div className="w-16 h-16 bg-primary/10 group-hover:bg-primary/20 rounded-2xl flex items-center justify-center text-primary transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {BLOG_ICONS[idx % BLOG_ICONS.length]}
                    </svg>
                  </div>
                </div>
              )}
              <div className="p-5">
                <h4 className="font-bold text-base text-text-primary line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors">{blog.title}</h4>
                <p className="text-text-secondary text-sm line-clamp-3 leading-relaxed">{blog.description}</p>
                <span className="inline-flex items-center gap-1 text-primary text-sm font-bold mt-3 group-hover:gap-2 transition-all">
                  Read More
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
