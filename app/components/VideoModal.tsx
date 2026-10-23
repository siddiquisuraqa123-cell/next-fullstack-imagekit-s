"use client";

import React, { useEffect, useRef, useState } from "react";
import { FeaturedMovie } from "./HeroBanner";

interface VideoModalProps {
  movie: FeaturedMovie | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayMovie?: (movie: FeaturedMovie) => void;
  similarMovies?: FeaturedMovie[];
}

export default function VideoModal({
  movie,
  isOpen,
  onClose,
  onPlayMovie,
  similarMovies = [],
}: VideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [inMyList, setInMyList] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && movie?.videoUrl) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isOpen, movie]);

  if (!isOpen || !movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-4xl bg-[#181818] rounded-t-2xl sm:rounded-xl overflow-hidden shadow-2xl border border-zinc-800 text-white z-10 h-[92dvh] sm:h-auto sm:max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (Prominent touch target) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors border border-zinc-700/80 shadow-lg active:scale-95"
          aria-label="Close details"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Top Video Player / Preview Area */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex-shrink-0">
          {movie.videoUrl && isPlaying ? (
            <video
              ref={videoRef}
              src={movie.videoUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="relative w-full h-full">
              <img
                src={movie.thumbnailUrl}
                alt={movie.title}
                className="w-full h-full object-cover filter brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-black/40" />

              {/* Play Overlay Button */}
              {movie.videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center shadow-2xl transition-transform active:scale-90 pl-1"
                    aria-label="Play video"
                  >
                    <svg className="w-7 h-7 sm:w-10 sm:h-10 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Title on backdrop if video is not yet fullscreen/playing */}
          {!isPlaying && (
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex items-end justify-between z-20">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-black drop-shadow-lg">
                  {movie.title}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="flex items-center gap-2 px-5 sm:px-6 py-2 rounded bg-white hover:bg-white/80 text-black font-bold text-xs sm:text-sm shadow transition-transform active:scale-95"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                  </button>
                  <button
                    onClick={() => setInMyList((prev) => !prev)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-zinc-400 hover:border-white flex items-center justify-center transition-colors ${
                      inMyList ? "bg-emerald-600 border-emerald-500" : "bg-black/50"
                    }`}
                    aria-label="Add to My List"
                  >
                    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                      {inMyList ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsLiked((prev) => !prev)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-zinc-400 hover:border-white flex items-center justify-center transition-colors ${
                      isLiked ? "bg-rose-600 border-rose-500 text-white" : "bg-black/50"
                    }`}
                    aria-label="Like video"
                  >
                    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Scrollable Details Content */}
        <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 flex-1 pb-safe">
          {/* Metadata & Quick Specs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shadow ${
                  movie.type === "series" ? "bg-amber-600 text-white" : "bg-[#E50914] text-white"
                }`}>
                  {movie.type === "series" ? "SERIES" : "FILM"}
                </span>
                <span className="text-emerald-400 font-bold">
                  {movie.matchScore ?? 98}% Match
                </span>
                <span className="text-zinc-400">{movie.releaseYear || "2026"}</span>
                <span className="border border-zinc-600 px-1.5 py-0.5 text-[10px] sm:text-xs text-zinc-300 rounded">
                  {movie.rating ?? "16+"}
                </span>
                {movie.type === "series" && movie.seasons ? (
                  <span className="text-amber-400 font-semibold border border-amber-500/40 px-1.5 py-0.5 rounded bg-amber-500/10">
                    {movie.seasons}
                  </span>
                ) : (
                  <span className="text-zinc-300">{movie.duration ?? "1h 55m"}</span>
                )}
                <span className="border border-zinc-500 text-zinc-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Ultra HD 4K
                </span>
                <span className="border border-zinc-500 text-zinc-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">
                  HDR
                </span>
              </div>

              <p className="text-zinc-200 text-xs sm:text-sm md:text-base leading-relaxed">
                {movie.description}
              </p>
            </div>

            {/* Right sidebar info: Cast, Genres, Tags */}
            <div className="space-y-1.5 text-xs text-zinc-400 border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-6">
              <div>
                <span className="text-zinc-500 font-medium">Cast: </span>
                <span className="text-zinc-300">
                  Alex North, Jordan Cruz, Maya Lin, Elena Rostova
                </span>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Genres: </span>
                <span className="text-zinc-300">
                  {movie.tags?.join(", ") || "Action, Sci-Fi, Streaming Originals"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">
                  {movie.type === "series" ? "This show is: " : "This film is: "}
                </span>
                <span className="text-zinc-300">
                  Mind-Bending, Suspenseful, Visually Stunning
                </span>
              </div>
              <div className="pt-1">
                <span className="text-zinc-500 font-medium">Audio: </span>
                <span className="text-zinc-300">
                  English [Original], Spanish, French, German
                </span>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Subtitles: </span>
                <span className="text-zinc-300">English, Spanish, Arabic, Hindi</span>
              </div>
            </div>
          </div>

          {/* More Like This Grid */}
          {similarMovies.length > 0 && (
            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">More Like This</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {similarMovies.slice(0, 6).map((similar) => (
                  <div
                    key={similar.id}
                    onClick={() => {
                      if (onPlayMovie) onPlayMovie(similar);
                    }}
                    className="bg-zinc-900 rounded-md overflow-hidden cursor-pointer group active:scale-95 transition-transform border border-zinc-800/80"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={similar.thumbnailUrl}
                        alt={similar.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1.5 right-1.5 text-[10px] font-bold text-zinc-300 bg-black/75 px-1 py-0.5 rounded">
                        {similar.duration ?? "1h 40m"}
                      </div>
                    </div>
                    <div className="p-2 sm:p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 text-[11px] font-bold">
                          {similar.matchScore ?? 96}% Match
                        </span>
                        <span className="border border-zinc-700 text-[9px] px-1 text-zinc-400 rounded">
                          {similar.rating ?? "16+"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">
                        {similar.title}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-2">
                        {similar.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
