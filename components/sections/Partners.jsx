export default function Partners({ partners }) {
  // If no partners provided by admin, fallback to some empty card placeholders for layout
  const displayPartners = partners && partners.length > 0 ? partners : Array.from({ length: 20 }, (_, i) => ({ id: i, name: `Partner ${i+1}` }));
  
  // Split into two rows
  const row1 = displayPartners.slice(0, Math.ceil(displayPartners.length / 2));
  const row2 = displayPartners.slice(Math.ceil(displayPartners.length / 2));

  return (
    <section className="py-20 overflow-hidden bg-white">
      <div className="mx-auto max-w-4xl w-[75%] text-center mb-12">
        <h2 className="text-3xl">Our Trusted Partners</h2>
      </div>

      <div className="flex flex-col gap-6 relative">
        {/* Fade gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

        {/* Row 1: Left scroll */}
        <div className="flex overflow-hidden group">
          <div className="flex gap-6 scroll-track-left min-w-max pr-6">
            {[...row1, ...row1, ...row1].map((partner, idx) => (
              <div key={`r1-${idx}`} className="w-48 h-24 bg-white border border-premium shadow-premium rounded-2xl flex items-center justify-center p-4 hover-scale cursor-pointer">
                {partner.image_url ? (
                  <img src={partner.image_url} alt={partner.name} className="max-w-full max-h-full object-contain transition-all duration-300" />
                ) : (
                  <span className="font-bold text-text-secondary">{partner.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Right scroll */}
        <div className="flex overflow-hidden group">
          <div className="flex gap-6 scroll-track-right min-w-max pr-6">
            {[...row2, ...row2, ...row2].map((partner, idx) => (
              <div key={`r2-${idx}`} className="w-48 h-24 bg-white border border-premium shadow-premium rounded-2xl flex items-center justify-center p-4 hover-scale cursor-pointer">
                {partner.image_url ? (
                  <img src={partner.image_url} alt={partner.name} className="max-w-full max-h-full object-contain transition-all duration-300" />
                ) : (
                  <span className="font-bold text-text-secondary">{partner.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
