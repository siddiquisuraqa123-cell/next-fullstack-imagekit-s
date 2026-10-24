"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  onOpenMobileSidebar: () => void;
  onOpenUpload: () => void;
  loading?: boolean;
}

const CONTENT_FILTERS = [
  "All Videos",
  "Trailers & Teasers",
  "Movies & Blockbusters",
  "Gaming & Esports",
  "Music & Shows",
  "Tech & Science",
];

export default function DashboardHeader({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  selectedFilter,
  onSelectFilter,
  onOpenMobileSidebar,
  onOpenUpload,
  loading = false,
}: DashboardHeaderProps) {
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  return (
    <header className="sticky top-0 z-20 w-full bg-[#090e13]/90 backdrop-blur-md border-b border-[#182635] px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-200">
      {/* Left: Mobile hamburger & Brand (mobile only) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-300 hover:text-white bg-[#121c27] hover:bg-[#182635] border border-[#1b2b3a] rounded-xl transition-colors active:scale-95"
          aria-label="Open sidebar menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Brand text */}
        <div className="lg:hidden flex items-center gap-1.5">
          <span className="text-sm font-black text-white">STREAM<span className="text-[#E50914]">FLIX</span></span>
        </div>

        {/* Desktop Content Selector Dropdown */}
        <div className="hidden sm:flex items-center">
          <div className="relative">
            <select
              value={selectedFilter}
              onChange={(e) => onSelectFilter(e.target.value)}
              className="appearance-none bg-[#111c27] hover:bg-[#142332] text-slate-200 hover:text-white text-xs font-bold py-2.5 pl-3.5 pr-8 rounded-xl border border-[#1b2b3a] focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
            >
              {CONTENT_FILTERS.map((f) => (
                <option key={f} value={f} className="bg-[#111c27] text-slate-200">
                  {f}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Prominent Search Input with Search Icon */}
      <form onSubmit={onSearchSubmit} className="flex-1 max-w-xl mx-2">
        <div className="relative flex items-center w-full">
          <div className="absolute left-3.5 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search real YouTube videos, cinema, creators..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#111c27] hover:bg-[#142230] focus:bg-[#111c27] text-white placeholder-slate-400 text-xs sm:text-sm pl-10 pr-20 py-2.5 rounded-xl border border-[#1b2b3a] focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/80 transition-all outline-none shadow-inner"
          />

          {/* Clear or Submit buttons inside bar */}
          <div className="absolute right-1.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="p-1 text-slate-400 hover:text-white rounded-md text-xs"
                title="Clear input"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 active:scale-95 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              title="Search"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Right: Upload & Profile Area */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Upload Button */}
        <button
          onClick={onOpenUpload}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#121c27] hover:bg-[#192737] text-slate-300 hover:text-white text-xs font-bold border border-[#1b2b3a] transition-all shadow-sm"
          title="Upload Video to ImageKit"
        >
          <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload</span>
        </button>

        {/* Profile Dropdown Area */}
        <div className="relative">
          {session?.user ? (
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-xl bg-[#111c27] hover:bg-[#162433] border border-[#1b2b3a] transition-colors"
              aria-label="User profile"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 p-[1px] flex items-center justify-center flex-shrink-0">
                <div className="w-full h-full bg-[#0d1620] rounded-[6px] flex items-center justify-center font-bold text-xs text-white uppercase">
                  {session.user.email ? session.user.email[0] : "U"}
                </div>
              </div>
              <span className="hidden xl:inline text-xs font-bold text-slate-200 max-w-[120px] truncate">
                {session.user.email?.split("@")[0]}
              </span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="px-3.5 py-1.5 bg-[#E50914] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Profile Dropdown Modal */}
          {showProfileMenu && session?.user && (
            <div className="absolute right-0 mt-2 w-56 bg-[#111c27] rounded-xl border border-[#1e3042] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-[#1b2b3a] mb-1">
                <p className="text-[10px] uppercase font-bold text-teal-400">Signed In As</p>
                <p className="text-xs font-bold text-white truncate">{session.user.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenUpload();
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#182635] rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Upload Video
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 mt-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
