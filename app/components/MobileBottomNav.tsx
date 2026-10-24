"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface MobileBottomNavProps {
  onSearchClick: () => void;
  onUploadClick: () => void;
  onHomeClick: () => void;
  onTrendingClick: () => void;
  onProfileClick: () => void;
  activeTab?: string;
}

export default function MobileBottomNav({
  onSearchClick,
  onUploadClick,
  onHomeClick,
  onProfileClick,
  activeTab = "home",
}: MobileBottomNavProps) {
  const { data: session } = useSession();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141414]/95 backdrop-blur-xl border-t border-zinc-800/90 shadow-[0_-4px_20px_rgba(0,0,0,0.6)] pb-safe"
      aria-label="Mobile Navigation Bar"
    >
      <div className="grid grid-cols-5 items-center justify-around h-14 px-2">
        {/* Home */}
        <button
          onClick={onHomeClick}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
            activeTab === "home" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
          aria-label="Home"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-[10px] font-medium tracking-tight">Home</span>
        </button>

        {/* Search */}
        <button
          onClick={onSearchClick}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
            activeTab === "search" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[10px] font-medium tracking-tight">Search</span>
        </button>

        {/* Upload (Prominent Center Button) */}
        <button
          onClick={onUploadClick}
          className="flex flex-col items-center justify-center gap-1 w-full h-full text-zinc-400 hover:text-white transition-colors"
          aria-label="Upload Video"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E50914] to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/40 active:scale-95 transition-transform">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[9px] font-bold text-zinc-300">Upload</span>
        </button>

        {/* YouTube */}
        <Link
          href="/youtube"
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
            activeTab === "youtube" ? "text-red-500 font-bold" : "text-zinc-500 hover:text-red-400"
          }`}
          aria-label="YouTube Hub"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span className="text-[10px] font-medium tracking-tight">YouTube</span>
        </Link>

        {/* Profile / Account */}
        <button
          onClick={onProfileClick}
          className="flex flex-col items-center justify-center gap-1 w-full h-full text-zinc-500 hover:text-white transition-colors"
          aria-label="Profile and Settings"
        >
          <div className="w-5 h-5 rounded-[4px] bg-gradient-to-tr from-rose-600 to-amber-500 p-[1px] flex items-center justify-center">
            <div className="w-full h-full bg-[#1e1e1e] rounded-[3px] flex items-center justify-center font-bold text-[9px] text-white uppercase">
              {session?.user?.email ? session.user.email[0] : "N"}
            </div>
          </div>
          <span className="text-[10px] font-medium tracking-tight">
            {session ? "Profile" : "Sign In"}
          </span>
        </button>
      </div>
    </nav>
  );
}
