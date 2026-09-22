"use client";

import { useState, useEffect } from "react";

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    fetch("/api/videos")
      .then(r => r.json())
      .then(d => {
        if (d.success) setVideos(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-20 anim-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">Tax & Business Video Guides</h1>
        <p className="text-text-secondary text-sm mt-1">Watch step-by-step video tutorials on FBR tax filing, IRIS login, wealth statement preparation, and NTN verification.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {videos.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No video tutorials published yet. Check back soon!
            </div>
          ) : (
            videos.map(video => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2">{video.title}</h3>
                  <span className="text-[11px] text-primary font-semibold mt-2 inline-block">Watch Tutorial →</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 anim-fade-in" onClick={() => setSelectedVideo(null)}>
          <div className="bg-black rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtube_id}?autoplay=1`}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
              <p className="font-bold text-sm truncate">{selectedVideo.title}</p>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-400 hover:text-white text-xs font-bold px-3 py-1 bg-gray-800 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
