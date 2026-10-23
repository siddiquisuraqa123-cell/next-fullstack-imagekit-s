"use client";

import React, { useState } from "react";

export interface FeaturedMovie {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  matchScore?: number;
  rating?: string;
  duration?: string;
  tags?: string[];
  isOriginal?: boolean;
  type?: "movie" | "series";
  seasons?: string;
  genre?: string;
  releaseYear?: string;
}

interface HeroBannerProps {
  movie: FeaturedMovie | null;
  onPlay: (movie: FeaturedMovie) => void;
  onMoreInfo: (movie: FeaturedMovie) => void;
}

export default function HeroBanner({ movie, onPlay, onMoreInfo }: HeroBannerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  if (!movie) {
    return (
      <div className="relative h-[65vh] sm:h-[75vh] md:h-[85vh] w-full bg-[#181818] animate-pulse flex items-end p-6 md:p-16">
        <div className="space-y-4 max-w-xl">
          <div className="h-5 w-28 bg-zinc-700 rounded" />
          <div className="h-10 w-72 sm:w-96 bg-zinc-700 rounded" />
          <div className="h-14 w-full bg-zinc-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[68vh] sm:h-[78vh] md:h-[90vh] w-full overflow-hidden select-none">
      {/* Background Media: Video preview or high-res thumbnail */}
      {movie.videoUrl && !videoError ? (
        <video
          key={movie.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster={movie.thumbnailUrl}
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.85]"
        >
          <source src={movie.videoUrl} type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center filter brightness-[0.85] transition-all duration-700"
          style={{ backgroundImage: `url('${movie.thumbnailUrl}')` }}
        />
      )}

      {/* Cinematic Vignettes and Gradients */}
      {/* 1. Dark bottom gradient fading seamlessly into content rows */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent" />
      {/* 2. Left side gradient for optimal text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
      {/* 3. Top subtle shadow for navbar readability */}
      <div className="absolute top-0 inset-x-0 h-28 sm:h-36 bg-gradient-to-b from-black/80 to-transparent" />

      {/* Hero Content Overlay */}
      <div className="absolute bottom-[10%] sm:bottom-[16%] md:bottom-[22%] left-4 right-4 sm:right-auto md:left-12 max-w-2xl z-20 space-y-2.5 sm:space-y-3 md:space-y-4">
        {/* Netflix Series / Original Badge */}
        <div className="flex items-center gap-2 text-xs md:text-sm font-black tracking-widest uppercase">
          <span className={`text-white px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider shadow ${
            movie.type === "series" ? "bg-amber-600" : "bg-[#E50914]"
          }`}>
            {movie.type === "series" ? "SERIES" : "FILM"}
          </span>
          <span className="text-zinc-300 font-bold tracking-widest text-[10px] sm:text-[11px] md:text-xs">
            {movie.isOriginal ? "STREAMFLIX ORIGINAL" : "STREAMFLIX EXCLUSIVE"}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tight leading-tight md:leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
          {movie.title}
        </h1>

        {/* Badges / Metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-semibold">
          <span className="text-emerald-400 font-bold">
            {movie.matchScore ?? 98}% Match
          </span>
          {movie.releaseYear && (
            <span className="text-zinc-300 text-xs">{movie.releaseYear}</span>
          )}
          <span className="text-zinc-400 border border-zinc-600 px-1.5 py-0.5 text-[10px] sm:text-[11px] rounded">
            {movie.rating ?? "16+"}
          </span>
          {movie.type === "series" && movie.seasons ? (
            <span className="text-amber-400 font-medium text-xs border border-amber-500/40 px-1.5 py-0.5 rounded bg-amber-500/10">
              {movie.seasons}
            </span>
          ) : (
            <span className="text-zinc-300 text-xs">{movie.duration ?? "1h 52m"}</span>
          )}
          <span className="border border-zinc-500/70 text-zinc-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
            Ultra HD
          </span>
          <span className="hidden sm:inline border border-zinc-500/70 text-zinc-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
            5.1 Audio
          </span>
        </div>

        {/* Synopsis Description */}
        <p className="text-zinc-200 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2 sm:line-clamp-3 md:line-clamp-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-normal text-opacity-90 max-w-xl">
          {movie.description}
        </p>

        {/* Action Buttons (Mobile-friendly side-by-side full touch targets) */}
        <div className="flex items-center gap-2.5 sm:gap-3 pt-1.5 sm:pt-2 w-full sm:w-auto">
          {/* Play Button */}
          <button
            onClick={() => onPlay(movie)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 md:py-3 rounded bg-white hover:bg-white/85 text-black font-bold text-xs sm:text-sm md:text-base transition-all duration-200 shadow-xl active:scale-95"
            aria-label="Play Featured Movie"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>

          {/* More Info Button */}
          <button
            onClick={() => onMoreInfo(movie)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-7 py-2.5 md:py-3 rounded bg-zinc-600/70 hover:bg-zinc-600/50 text-white font-semibold text-xs sm:text-sm md:text-base backdrop-blur-md transition-all duration-200 active:scale-95 border border-zinc-500/30 shadow-lg"
            aria-label="More Info about Featured Movie"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            More Info
          </button>
        </div>
      </div>

      {/* Floating Controls: Volume / Mute & Maturity Rating */}
      <div className="absolute right-3 sm:right-0 bottom-[14%] sm:bottom-[18%] md:bottom-[24%] flex items-center gap-2.5 sm:gap-3.5 z-20">
        {movie.videoUrl && !videoError && (
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-2 sm:p-2.5 rounded-full border border-zinc-500/80 bg-black/50 hover:bg-black/80 text-zinc-300 hover:text-white backdrop-blur-md transition-all duration-200 active:scale-90"
            title={isMuted ? "Unmute sound" : "Mute sound"}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            )}
          </button>
        )}

        {/* Maturity badge */}
        <div className="bg-black/60 border-l-2 sm:border-l-4 border-zinc-200 text-zinc-300 px-2 sm:px-4 py-0.5 sm:py-1 text-[11px] sm:text-xs md:text-sm font-bold flex items-center pr-3 sm:pr-6 backdrop-blur-sm">
          {movie.rating ?? "16+"}
        </div>
      </div>
    </div>
  );
}
