"use client";

import React, { useRef } from "react";
import { YouTubeVideoItem } from "@/types/youtube";

interface VideoCarouselRowProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  videos: YouTubeVideoItem[];
  onPlay: (video: YouTubeVideoItem) => void;
  favorites?: string[]; // array of video IDs
  onToggleFavorite?: (video: YouTubeVideoItem) => void;
  loading?: boolean;
}

export default function VideoCarouselRow({
  title,
  icon,
  subtitle,
  videos,
  onPlay,
  favorites = [],
  onToggleFavorite,
  loading = false,
}: VideoCarouselRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      const newPos = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      rowRef.current.scrollTo({ left: newPos, behavior: "smooth" });
    }
  };

  if (!loading && videos.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full my-6 sm:my-8 group/row">
      {/* Row Header with Title & Controls */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-teal-400">{icon}</span>}
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs text-slate-500 font-normal hidden sm:inline">
                ({videos.length} videos)
              </span>
            </h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Carousel Navigation Chevron Arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => handleScroll("left")}
            className="w-8 h-8 rounded-xl bg-[#111c27] hover:bg-[#182737] border border-[#1b2b3a] text-slate-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            aria-label={`Scroll ${title} left`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="w-8 h-8 rounded-xl bg-[#111c27] hover:bg-[#182737] border border-[#1b2b3a] text-slate-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            aria-label={`Scroll ${title} right`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={rowRef}
        className="flex items-stretch gap-3.5 sm:gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
      >
        {/* Loading Skeletons */}
        {loading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="w-[240px] sm:w-[270px] md:w-[300px] flex-none rounded-2xl bg-[#0f1722] border border-[#1a2838] overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-[#152332]" />
              <div className="p-3.5 space-y-2">
                <div className="h-4 bg-[#182636] rounded w-5/6" />
                <div className="h-3 bg-[#152332] rounded w-1/2" />
              </div>
            </div>
          ))}

        {/* Video Cards */}
        {!loading &&
          videos.map((video) => {
            const isFav = favorites.includes(video.id);
            const dateStr = video.publishedAt
              ? new Date(video.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : "";

            return (
              <div
                key={video.id}
                onClick={() => onPlay(video)}
                className="group relative w-[240px] sm:w-[270px] md:w-[300px] flex-none rounded-2xl bg-[#0f1722] hover:bg-[#121d2a] border border-[#192736] hover:border-teal-500/50 shadow-lg hover:shadow-2xl hover:shadow-teal-950/40 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col active:scale-95 md:hover:scale-[1.03]"
              >
                {/* 16:9 Thumbnail Image */}
                <div className="relative aspect-video w-full bg-[#0a0f14] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    loading="lazy"
                    className="w-full h-full object-cover filter brightness-95 group-hover:brightness-105 group-hover:scale-105 transition-all duration-500 ease-out"
                  />

                  {/* Gradient & Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1722] via-transparent to-black/30 opacity-70 group-hover:opacity-40 transition-opacity" />

                  {/* Top HD / Category Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-black text-red-500 uppercase tracking-wider border border-white/10">
                      YouTube
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[9px] font-bold border border-teal-500/30">
                      HD
                    </span>
                  </div>

                  {/* Quick Favorite Icon Button */}
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(video);
                      }}
                      className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isFav
                          ? "bg-red-600 text-white shadow-md shadow-red-600/40"
                          : "bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 opacity-0 group-hover:opacity-100"
                      }`}
                      title={isFav ? "Remove Favorite" : "Add Favorite"}
                    >
                      <svg
                        className="w-3.5 h-3.5 fill-current"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={isFav ? 0 : 2}
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  )}

                  {/* Center Play Overlay Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E50914] to-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/50 transform group-hover:scale-110 transition-transform pl-0.5">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card Content Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-xs sm:text-sm font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug"
                      title={video.title}
                    >
                      {video.title}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#182635] flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300 truncate max-w-[65%]" title={video.channelTitle}>
                      {video.channelTitle}
                    </span>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">{dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
