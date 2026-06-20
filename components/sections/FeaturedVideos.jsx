"use client";

import { useState } from "react";

export default function FeaturedVideos({ videos }) {
  const [activeVideo, setActiveVideo] = useState(null);

  const displayVideos = videos && videos.length > 0 ? videos : [
    { id: 1, youtube_id: 'dQw4w9WgXcQ', title: 'How to file taxes in 6 minutes' },
    { id: 2, youtube_id: 'dQw4w9WgXcQ', title: 'Why register a Private Limited Company?' },
    { id: 3, youtube_id: 'dQw4w9WgXcQ', title: 'Understanding Sales Tax in Pakistan' },
    { id: 4, youtube_id: 'dQw4w9WgXcQ', title: 'Step-by-step USA LLC Registration' }
  ].slice(0, 4);

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-[1400px] w-[75%]">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl mb-4">Featured Videos</h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">Learn more about our services through our detailed guides.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {displayVideos.map((video) => (
            <div 
              key={video.id} 
              className="bg-white rounded-[1.5rem] border border-premium shadow-premium overflow-hidden group cursor-pointer hover-scale"
              onClick={() => setActiveVideo(video.youtube_id)}
            >
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                <img 
                  src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-primary transform scale-90 group-hover:scale-100 transition-transform">
                    <svg className="w-6 h-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-sm text-text-primary line-clamp-2 leading-snug">{video.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Popup Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 anim-fade-in">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-premium overflow-hidden shadow-2xl">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-primary transition-colors text-4xl"
              onClick={() => setActiveVideo(null)}
            >
              &times;
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`} 
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </section>
  );
}
