"use client";

import React, { useRef, useState } from "react";
import { FeaturedMovie } from "./HeroBanner";

interface MovieRowProps {
  title: string;
  movies: FeaturedMovie[];
  onPlay: (movie: FeaturedMovie) => void;
  onSelect: (movie: FeaturedMovie) => void;
}

export default function MovieRow({
  title,
  movies,
  onPlay,
  onSelect,
}: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isMoved, setIsMoved] = useState(false);
  const [myList, setMyList] = useState<Record<string, boolean>>({});

  const handleScroll = (direction: "left" | "right") => {
    setIsMoved(true);
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount =
        direction === "left"
          ? scrollLeft - clientWidth * 0.75
          : scrollLeft + clientWidth * 0.75;
      rowRef.current.scrollTo({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const toggleMyList = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMyList((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-1.5 sm:space-y-2 md:space-y-3 px-3 sm:px-6 md:px-12 my-4 sm:my-6 md:my-8 group relative select-none">
      {/* Row Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg md:text-2xl font-bold text-zinc-100 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5">
          <span>{title}</span>
          <span className="text-xs text-[#E50914] opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold hidden sm:inline">
            Explore All ›
          </span>
        </h2>
      </div>

      {/* Row Container with arrows (arrows only visible on desktop hover) */}
      <div className="relative group/row">
        {/* Left Arrow Button (Desktop Only) */}
        <button
          onClick={() => handleScroll("left")}
          className={`hidden md:flex absolute top-0 bottom-0 left-0 z-40 m-auto h-full w-10 md:w-14 bg-black/60 hover:bg-black/85 text-white items-center justify-center transition-all duration-300 opacity-0 group-hover/row:opacity-100 cursor-pointer ${
            !isMoved ? "hidden" : "flex"
          }`}
          aria-label="Scroll left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 md:w-8 md:h-8 hover:scale-125 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Horizontal Slider (Native touch momentum scrolling on mobile) */}
        <div
          ref={rowRef}
          className="flex items-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-3 -my-3 px-1"
        >
          {movies.map((movie) => {
            const inList = myList[movie.id];
            return (
              <div
                key={`${title}-${movie.id}`}
                onClick={() => onSelect(movie)}
                className="relative flex-none w-[140px] sm:w-[200px] md:w-[270px] aspect-video rounded-md overflow-hidden bg-zinc-900 cursor-pointer transition-all duration-300 active:scale-95 md:hover:scale-105 md:hover:z-30 md:hover:shadow-[0_10px_25px_rgba(0,0,0,0.8)] border border-zinc-800/80 md:hover:border-zinc-700 group/card"
              >
                {/* Thumbnail Image */}
                <img
                  src={movie.thumbnailUrl}
                  alt={movie.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center filter brightness-95 group-hover/card:brightness-105 transition-all duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80";
                  }}
                />

                {/* Streamflix N badge if original */}
                {movie.isOriginal && (
                  <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                    <span className="bg-[#E50914] text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded shadow">
                      N
                    </span>
                  </div>
                )}

                {/* Mobile Persistent Card Info Overlay (Always visible on mobile touch screens) */}
                <div className="md:hidden absolute inset-x-0 bottom-0 p-1.5 sm:p-2 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col justify-end">
                  <h3 className="font-bold text-white text-[11px] sm:text-xs truncate">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px] text-zinc-300 mt-0.5">
                    <span className="text-emerald-400 font-bold">
                      {movie.matchScore ?? 97}%
                    </span>
                    <span className="border border-zinc-600 px-0.5 rounded text-[8px]">
                      {movie.rating ?? "16+"}
                    </span>
                  </div>
                </div>

                {/* Desktop Interactive Hover Information Overlay */}
                <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

                <div className="hidden md:flex absolute inset-x-0 bottom-0 p-3 flex-col gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black via-black/90 to-transparent">
                  {/* Action Icons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* Play button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlay(movie);
                        }}
                        className="w-7 h-7 rounded-full bg-white text-black hover:bg-white/80 flex items-center justify-center transition-transform hover:scale-110 shadow"
                        title="Play"
                      >
                        <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>

                      {/* Add to My List */}
                      <button
                        onClick={(e) => toggleMyList(e, movie.id)}
                        className={`w-7 h-7 rounded-full border border-zinc-400 hover:border-white flex items-center justify-center transition-colors text-white ${
                          inList ? "bg-emerald-600 border-emerald-500" : "bg-black/40 hover:bg-zinc-800"
                        }`}
                        title={inList ? "Remove from My List" : "Add to My List"}
                      >
                        {inList ? (
                          <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </button>

                      {/* Like button */}
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-7 h-7 rounded-full border border-zinc-400 hover:border-white bg-black/40 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors"
                        title="I like this"
                      >
                        <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </button>
                    </div>

                    {/* Expand Detail Modal button */}
                    <button
                      onClick={() => onSelect(movie)}
                      className="w-7 h-7 rounded-full border border-zinc-400 hover:border-white bg-black/40 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors ml-auto"
                      title="Episode info"
                    >
                      <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Title & metadata */}
                  <div>
                    <h3 className="font-bold text-white text-xs md:text-sm truncate">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs mt-0.5">
                      <span className="text-emerald-400 font-bold">
                        {movie.matchScore ?? 97}% Match
                      </span>
                      <span className="text-zinc-400 border border-zinc-600 px-1 py-0.2 rounded text-[9px]">
                        {movie.rating ?? "16+"}
                      </span>
                      <span className="text-zinc-400">{movie.duration ?? "1h 48m"}</span>
                      <span className="text-zinc-300 font-semibold border border-zinc-700 px-1 rounded text-[9px]">
                        HD
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {movie.tags && movie.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[9px] text-zinc-400 font-medium truncate">
                      {movie.tags.slice(0, 3).map((tag, i) => (
                        <span key={tag}>
                          {tag}
                          {i < Math.min(movie.tags!.length, 3) - 1 ? " • " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button (Desktop Only) */}
        <button
          onClick={() => handleScroll("right")}
          className="hidden md:flex absolute top-0 bottom-0 right-0 z-40 m-auto h-full w-10 md:w-14 bg-black/60 hover:bg-black/85 text-white items-center justify-center transition-all duration-300 opacity-0 group-hover/row:opacity-100 cursor-pointer"
          aria-label="Scroll right"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 md:w-8 md:h-8 hover:scale-125 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
