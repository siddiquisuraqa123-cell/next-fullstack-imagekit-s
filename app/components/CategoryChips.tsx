"use client";

import React, { useRef } from "react";

export const CATEGORIES = [
  "All",
  "Trending",
  "Entertainment",
  "Gaming",
  "Technology",
  "Music",
  "Sports",
  "Education",
  "Comedy",
  "News",
];

interface CategoryChipsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryChips({
  selectedCategory,
  onSelectCategory,
}: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -250 : 250;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full my-5 group/chips">
      {/* Scroll Left Button */}
      <button
        onClick={() => handleScroll("left")}
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#111c27] border border-[#1e3042] text-slate-300 hover:text-white items-center justify-center shadow-lg opacity-0 group-hover/chips:opacity-100 transition-opacity"
        aria-label="Scroll categories left"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Horizontally scrollable chip container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                isSelected
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold border-teal-400 shadow-md shadow-teal-900/40 scale-105"
                  : "bg-[#0f1722] hover:bg-[#152332] text-slate-300 hover:text-white border-[#1a2838] active:scale-95"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => handleScroll("right")}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#111c27] border border-[#1e3042] text-slate-300 hover:text-white items-center justify-center shadow-lg opacity-0 group-hover/chips:opacity-100 transition-opacity"
        aria-label="Scroll categories right"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
