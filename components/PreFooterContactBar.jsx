"use client";

export default function PreFooterContactBar({ settings = [] }) {
  const supportPhone =
    settings.find((s) => s.key === "support_phone")?.value ||
    settings.find((s) => s.key === "contact_phone")?.value ||
    "+92 349 1887803";

  const ntnPhone =
    settings.find((s) => s.key === "ntn_phone")?.value ||
    "+92 349 1887803";

  const usaPhone =
    settings.find((s) => s.key === "usa_phone")?.value ||
    "+1 (302) 555-0199";

  const contactEmail =
    settings.find((s) => s.key === "contact_email")?.value ||
    "info@digitax.pk";

  const locateUsUrl =
    settings.find((s) => s.key === "locate_us_url")?.value ||
    settings.find((s) => s.key === "google_maps_link")?.value ||
    "https://maps.google.com/?q=Pakistan";

  const cleanNumber = (val) => (val || "").replace(/[^0-9]/g, "");

  return (
    <div className="w-full bg-white border-y border-gray-200 py-3.5 px-4 overflow-x-auto shadow-sm">
      <div className="max-w-[1400px] w-[94%] md:w-[90%] mx-auto flex items-center justify-between gap-6 min-w-max">
        
        {/* Left: NEED SUPPORT */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-xs md:text-sm font-black text-gray-900 tracking-wider uppercase">
            Need Support?
          </span>
        </div>

        {/* Support Phone */}
        <a
          href={`tel:${supportPhone.replace(/\s+/g, "")}`}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-0.5">
              Support
            </span>
            <span className="text-xs md:text-sm font-extrabold text-gray-900 leading-none">
              {supportPhone}
            </span>
          </div>
        </a>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 shrink-0" />

        {/* NTN & Tax Filing WhatsApp Pill */}
        <a
          href={`https://wa.me/${cleanNumber(ntnPhone)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-[#E8F8F0] hover:bg-[#D7F3E3] border border-[#B7EBD0] px-4 py-1.5 rounded-2xl transition-all shadow-xs"
        >
          <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <span className="block text-[9px] font-bold text-emerald-800 uppercase tracking-wider leading-none mb-0.5">
              NTN & Tax Filing
            </span>
            <span className="text-xs md:text-sm font-extrabold text-emerald-950 leading-none">
              {ntnPhone}
            </span>
          </div>
        </a>

        {/* LLC & ITIN USA WhatsApp Pill */}
        <a
          href={`https://wa.me/${cleanNumber(usaPhone)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-[#E8F8F0] hover:bg-[#D7F3E3] border border-[#B7EBD0] px-4 py-1.5 rounded-2xl transition-all shadow-xs"
        >
          <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <span className="block text-[9px] font-bold text-emerald-800 uppercase tracking-wider leading-none mb-0.5">
              LLC & ITIN USA
            </span>
            <span className="text-xs md:text-sm font-extrabold text-emerald-950 leading-none">
              {usaPhone}
            </span>
          </div>
        </a>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 shrink-0" />

        {/* Email */}
        <a
          href={`mailto:${contactEmail}`}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-0.5">
              Email
            </span>
            <span className="text-xs md:text-sm font-extrabold text-gray-900 leading-none">
              {contactEmail}
            </span>
          </div>
        </a>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 shrink-0" />

        {/* Right: Locate Us */}
        <a
          href={locateUsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-extrabold text-xs md:text-sm transition-colors"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Locate Us</span>
        </a>

      </div>
    </div>
  );
}
