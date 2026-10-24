"use client";

import React, { useState } from "react";
import { YouTubeVideoItem } from "@/types/youtube";

export interface FeaturedVideoBannerProps {
  videos?: YouTubeVideoItem[];
  video?: YouTubeVideoItem | null;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  favoriteIds?: string[];
  isFavorite?: boolean;
  onPlay: (video: YouTubeVideoItem) => void;
  onToggleFavorite: (video: YouTubeVideoItem) => void;
}

export default function FeaturedVideoBanner({
  videos = [],
  video = null,
  currentIndex: controlledIndex,
  onIndexChange,
  favoriteIds,
  isFavorite = false,
  onPlay,
  onToggleFavorite,
}: FeaturedVideoBannerProps) {
  // Normalize items array
  const displayVideos = videos.length > 0 ? videos : video ? [video] : [];
  const itemsCount = displayVideos.length;

  const [internalIndex, setInternalIndex] = useState(0);
  const rawIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;
  // Derive safe index within bounds without needing an effect
  const activeIndex = itemsCount > 0 && rawIndex >= itemsCount ? 0 : rawIndex;

  if (itemsCount === 0) return null;

  const currentVideo = displayVideos[activeIndex] || displayVideos[0];
  if (!currentVideo) return null;

  const isCurrentFavorite = favoriteIds
    ? favoriteIds.includes(currentVideo.id)
    : isFavorite;

  const handlePrev = () => {
    if (itemsCount <= 1) return;
    const nextIdx = (activeIndex - 1 + itemsCount) % itemsCount;
    if (onIndexChange) {
      onIndexChange(nextIdx);
    } else {
      setInternalIndex(nextIdx);
    }
  };

  const handleNext = () => {
    if (itemsCount <= 1) return;
    const nextIdx = (activeIndex + 1) % itemsCount;
    if (onIndexChange) {
      onIndexChange(nextIdx);
    } else {
      setInternalIndex(nextIdx);
    }
  };

  const handleSelectIndex = (idx: number) => {
    if (idx === activeIndex) return;
    if (onIndexChange) {
      onIndexChange(idx);
    } else {
      setInternalIndex(idx);
    }
  };

  const formattedDate = currentVideo.publishedAt
    ? new Date(currentVideo.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    : "2024";

  return (
    <section className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-[#1b2b3a] shadow-2xl bg-[#0e1620] group">
      {/* Responsive Aspect Ratio / Height Container */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.35/1] min-h-[360px] sm:min-h-[400px] md:min-h-[440px] max-h-[470px] w-full overflow-hidden flex flex-col justify-end">
        {/* Background Real YouTube Thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={currentVideo.id}
          src={currentVideo.thumbnailUrl}
          alt={currentVideo.title}
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.72] group-hover:scale-105 transition-all duration-700 ease-out"
        />

        {/* Multi-layered Gradients for Contrast & Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070c12] via-[#070c12]/85 via-50% to-transparent w-full md:w-4/5 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070c12] via-[#070c12]/60 via-35% to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-950/25 via-transparent to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[#070c12]/20 z-10 pointer-events-none" />

        {/* Hero Content Overlay (Neatly aligned on the left) */}
        <div className="relative z-20 p-5 sm:p-8 md:p-10 lg:p-12 pb-16 sm:pb-8 md:pb-10 flex flex-col justify-end text-left items-start max-w-xl lg:max-w-2xl">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5 sm:mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E50914] text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-red-600/30 flex items-center gap-1">
              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Featured Spotlight
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold tracking-wide">
              4K Ultra HD
            </span>
            <span className="text-xs text-slate-400 font-medium">{formattedDate}</span>
          </div>

          {/* Video Title - comfortable maximum width, responsive typography */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight sm:leading-snug tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] line-clamp-2 max-w-lg lg:max-w-xl">
            {currentVideo.title}
          </h1>

          {/* Channel Info & Verified Badge */}
          <div className="mt-2 sm:mt-2.5 flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <div className="w-5 h-5 rounded-full bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-[10px] text-teal-300 font-bold shrink-0">
              {currentVideo.channelTitle ? currentVideo.channelTitle[0] : "Y"}
            </div>
            <span className="font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
              {currentVideo.channelTitle}
            </span>
            <svg className="w-3.5 h-3.5 text-teal-400 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>

          {/* Video Description Snippet */}
          {currentVideo.description && (
            <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-slate-300/90 line-clamp-2 leading-relaxed max-w-md sm:max-w-lg hidden sm:block">
              {currentVideo.description}
            </p>
          )}

          {/* Interactive CTA Buttons */}
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-3">
            {/* Primary Watch/Play Button */}
            <button
              type="button"
              onClick={() => onPlay(currentVideo)}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#E50914] to-red-600 hover:from-red-600 hover:to-red-700 active:scale-95 text-white text-xs sm:text-sm font-black transition-all duration-200 flex items-center gap-2.5 shadow-xl shadow-red-600/40 group/btn"
              aria-label={`Watch ${currentVideo.title}`}
            >
              <div className="w-5 h-5 rounded-full bg-white text-[#E50914] flex items-center justify-center pl-0.5 group-hover/btn:scale-110 transition-transform">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span>Watch Now</span>
            </button>

            {/* Favorite / Bookmark Button */}
            <button
              type="button"
              onClick={() => onToggleFavorite(currentVideo)}
              className={`px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 flex items-center gap-2 active:scale-95 ${
                isCurrentFavorite
                  ? "bg-red-500/20 text-red-300 border-red-500/40 shadow-sm"
                  : "bg-[#111c27]/80 hover:bg-[#162534] text-slate-200 border-[#1e2f41]"
              }`}
              title={isCurrentFavorite ? "Remove from Favorites" : "Add to Favorites"}
              aria-label={isCurrentFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <svg
                className={`w-4 h-4 ${isCurrentFavorite ? "fill-current text-red-500" : "text-slate-400"}`}
                fill={isCurrentFavorite ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{isCurrentFavorite ? "In Favorites" : "Favorites"}</span>
            </button>
          </div>
        </div>

        {/* Hero Carousel Controls (Previous / Next Arrows & Indicator Dots) */}
        {itemsCount > 1 && (
          <div
            className="absolute bottom-3 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2.5 bg-[#070c12]/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 rounded-full border border-[#1b2b3a] shadow-2xl shadow-black/80"
            role="region"
            aria-label="Featured video carousel controls"
          >
            {/* Previous Arrow Button */}
            <button
              type="button"
              onClick={handlePrev}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#111c27] hover:bg-teal-500/20 active:bg-teal-500/30 text-slate-300 hover:text-teal-300 border border-[#1e2f41] hover:border-teal-500/40 flex items-center justify-center transition-all duration-200 active:scale-90"
              aria-label="Previous featured video"
              title="Previous featured video"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Indicator Dots */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-1">
              {displayVideos.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleSelectIndex(idx)}
                    className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-400/60 ${
                      isActive
                        ? "w-6 sm:w-7 h-2 sm:h-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 shadow-md shadow-teal-500/50"
                        : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-slate-600/70 hover:bg-slate-400"
                    }`}
                    aria-label={`Go to slide ${idx + 1}: ${item.title}`}
                    aria-current={isActive ? "true" : undefined}
                    title={`Slide ${idx + 1}: ${item.title}`}
                  />
                );
              })}
            </div>

            {/* Next Arrow Button */}
            <button
              type="button"
              onClick={handleNext}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#111c27] hover:bg-teal-500/20 active:bg-teal-500/30 text-slate-300 hover:text-teal-300 border border-[#1e2f41] hover:border-teal-500/40 flex items-center justify-center transition-all duration-200 active:scale-90"
              aria-label="Next featured video"
              title="Next featured video"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

