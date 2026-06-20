"use client";

import { useState, useEffect } from "react";

export default function Testimonials({ testimonials }) {
  const displayTestimonials = testimonials && testimonials.length > 0 ? testimonials : [
    { id: 1, name: 'Ali Raza', role: 'CEO, TechCorp', review: 'DIGITAX completely transformed how we handle our annual returns. Fast, secure, and highly professional.' },
    { id: 2, name: 'Sara Ahmed', role: 'Freelancer', review: 'I used to dread tax season, but with DIGITAX it took literally 6 minutes. The dashboard is beautiful!' },
    { id: 3, name: 'Usman Khan', role: 'Founder, Startup Inc', review: 'Got our private limited company registered in record time. Highly recommend their services.' }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displayTestimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayTestimonials.length]);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="mx-auto max-w-[1400px] w-[75%] relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl mb-4">What Our Clients Say</h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">Trusted by thousands of individuals and businesses across Pakistan.</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-4xl h-[400px] flex items-center justify-center perspective-[1000px]">
            {displayTestimonials.map((testimonial, idx) => {
              // Calculate relative position
              let offset = idx - activeIndex;
              if (offset < -1) offset += displayTestimonials.length;
              if (offset > 1) offset -= displayTestimonials.length;

              const isCenter = offset === 0;
              const isLeft = offset === -1;
              const isRight = offset === 1;

              // If more than 3 items, hide the others
              if (!isCenter && !isLeft && !isRight) return null;

              return (
                <div 
                  key={testimonial.id}
                  className={`absolute w-full max-w-lg p-8 rounded-[2rem] border transition-all duration-500 ease-out
                    ${isCenter ? 'z-20 glass-effect scale-100 opacity-100 border-primary/20' : ''}
                    ${isLeft ? 'z-10 bg-white scale-75 opacity-40 -translate-x-1/2 rotate-y-[20deg] border-premium blur-[2px]' : ''}
                    ${isRight ? 'z-10 bg-white scale-75 opacity-40 translate-x-1/2 -rotate-y-[20deg] border-premium blur-[2px]' : ''}
                  `}
                  onClick={() => {
                    if (isLeft) setActiveIndex((prev) => (prev - 1 + displayTestimonials.length) % displayTestimonials.length);
                    if (isRight) setActiveIndex((prev) => (prev + 1) % displayTestimonials.length);
                  }}
                  style={{ cursor: isCenter ? 'default' : 'pointer' }}
                >
                  <div className="flex flex-col items-center text-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden shadow-md">
                      {testimonial.photo_url ? (
                        <img src={testimonial.photo_url} alt={testimonial.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                          {testimonial.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="text-xl italic text-text-primary">"{testimonial.review}"</p>
                    <div>
                      <h4 className="font-bold text-lg text-primary">{testimonial.name}</h4>
                      <p className="text-sm text-text-secondary">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              className="w-12 h-12 rounded-full border border-premium flex items-center justify-center hover-scale hover:border-primary hover:text-primary transition-colors bg-white shadow-sm"
              onClick={() => setActiveIndex((prev) => (prev - 1 + displayTestimonials.length) % displayTestimonials.length)}
            >
              &larr;
            </button>
            <button 
              className="w-12 h-12 rounded-full border border-premium flex items-center justify-center hover-scale hover:border-primary hover:text-primary transition-colors bg-white shadow-sm"
              onClick={() => setActiveIndex((prev) => (prev + 1) % displayTestimonials.length)}
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
