"use client";

export default function Team({ team, settings = [] }) {
  const sectionTitle = settings.find(s => s.key === "team_title")?.value || "Meet Our Dream Team";
  const teamTitleImage = settings.find(s => s.key === "team_title_image")?.value;
  const teamHeadingType = settings.find(s => s.key === "team_heading_type")?.value || (teamTitleImage ? "image" : "text");
  const teamImage = settings.find(s => s.key === "team_section_image")?.value;

  const displayTeam =
    team && team.length > 0
      ? team.filter(m => m.enabled !== 0)
      : [];

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      {/* Section Title or Heading Picture */}
      <div className="text-center mb-12 md:mb-16">
        {teamHeadingType === "image" && teamTitleImage ? (
          <div className="flex justify-center items-center">
            <img 
              src={teamTitleImage} 
              alt={sectionTitle} 
              className="max-h-24 md:max-h-36 max-w-[90%] object-contain drop-shadow-sm" 
            />
          </div>
        ) : (
          <>
            <h2 className="text-section-heading font-heading font-bold text-text-primary tracking-tight">
              {sectionTitle}
            </h2>
            <p className="text-text-secondary text-body-custom mt-3 max-w-xl mx-auto">
              We have a qualified team of tax consultants, advocates, corporate lawyers, and IT professionals to support you.
            </p>
          </>
        )}
      </div>

      {/* Main Team Banner with Decorative Circles */}
      <div className="mx-auto max-w-[1200px] w-[90%] md:w-[85%] relative">
        {/* Decorative Circles - Left Side */}
        <div className="absolute -left-6 md:-left-12 top-1/4 w-16 h-16 md:w-24 md:h-24 rounded-full bg-primary/10 blur-sm"></div>
        <div className="absolute -left-3 md:-left-8 top-2/3 w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/20 blur-sm"></div>

        {/* Decorative Circles - Right Side */}
        <div className="absolute -right-6 md:-right-12 top-1/4 w-16 h-16 md:w-24 md:h-24 rounded-full bg-primary/10 blur-sm"></div>
        <div className="absolute -right-3 md:-right-8 top-2/3 w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/20 blur-sm"></div>

        {/* Centered Horizontal Rectangle - Team Banner */}
        <div className="mx-auto max-w-[900px] bg-gradient-to-br from-primary/5 via-white to-primary/5 border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm">
          {teamImage ? (
            <img 
              src={teamImage} 
              alt="Our Team" 
              className="w-full h-[250px] md:h-[400px] object-cover"
            />
          ) : (
            <div className="w-full h-[250px] md:h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-primary/5 p-8">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-text-secondary text-sm md:text-base font-medium text-center">
                Image will be uploaded soon
              </p>
              <p className="text-text-secondary/60 text-xs mt-1 text-center">
                Upload a team banner image from the admin panel
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Members Grid (if any exist) */}
      {displayTeam.length > 0 && (
        <div className="mx-auto max-w-[1100px] w-[90%] md:w-[85%] mt-12 md:mt-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {displayTeam.map((member, index) => {
              const defaultPhotos = [
                "https://workik-widget-assets.s3.amazonaws.com/widget-assets/images/ft12.svg",
                "https://workik-widget-assets.s3.amazonaws.com/widget-assets/images/ft13.svg",
                "https://workik-widget-assets.s3.amazonaws.com/widget-assets/images/ft14.svg"
              ];
              const photo = member.photo_url || defaultPhotos[index % defaultPhotos.length];

              return (
                <div key={member.id || index} className="flex flex-col items-center text-center group">
                  <div className="w-36 sm:w-44 md:w-48 transition-all duration-300 group-hover:-translate-y-1.5 mb-4 flex items-center justify-center">
                    <img 
                      src={photo} 
                      alt={member.name} 
                      className="w-full h-auto object-contain drop-shadow-md group-hover:drop-shadow-xl transition-all duration-300"
                    />
                  </div>
                  <h4 className="font-bold text-text-primary text-sm md:text-base">{member.name}</h4>
                  <p className="text-text-secondary text-xs md:text-sm mt-0.5 font-medium">{member.role || "Consultant"}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
