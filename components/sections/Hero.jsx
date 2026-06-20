"use client";

export default function Hero({ settings = [], user = null }) {
  const title = settings.find(s => s.key === "site_slogan")?.value || "File Your Taxes In Just 6 Minutes With Our Qualified Consultants!";
  const description = settings.find(s => s.key === "hero_description")?.value || "Befiler goes beyond tax filing! We also help with business registration, sales tax filing, trademark registration, and LLC registration in the USA — all in one place.";
  const heroImage = settings.find(s => s.key === "hero_image")?.value;
  const ctaText = settings.find(s => s.key === "hero_cta_text")?.value || "File Now";
  const ctaLink = settings.find(s => s.key === "hero_cta_link")?.value || "/portal";

  const handleFileNow = () => {
    if (ctaLink && ctaLink.startsWith("http")) {
      window.location.href = ctaLink;
    } else if (user) {
      window.location.href = "/portal";
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <section className="relative w-full min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Image */}
      {heroImage ? (
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="" 
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70"></div>
      )}

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1400px] w-[90%] md:w-[85%] py-16 md:py-24">
        <div className="max-w-2xl flex flex-col items-start gap-5 md:gap-7 anim-slide-up">
          <span className="text-[11px] md:text-[12px] uppercase tracking-[0.2em] bg-white/15 backdrop-blur-sm text-white px-4 py-1.5 rounded-full font-bold border border-white/20">
            Corporate Tax Filing
          </span>
          <h1 className="text-hero-heading text-white tracking-tight font-heading font-bold drop-shadow-sm">
            {title}
          </h1>
          <p className="text-hero-desc text-white/85 leading-relaxed max-w-xl">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button 
              onClick={handleFileNow}
              className="bg-white text-primary font-bold px-8 py-3.5 rounded-full text-base shadow-lg hover:scale-105 active:scale-95 hover:shadow-xl transition-all cursor-pointer"
            >
              {ctaText}
            </button>
            <a 
              href="/services"
              className="border-2 border-white/30 text-white font-bold px-8 py-3.5 rounded-full text-base hover:bg-white/10 transition-all text-center"
            >
              View Services
            </a>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-10"></div>
    </section>
  );
}
