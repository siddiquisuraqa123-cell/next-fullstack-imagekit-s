"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface NavbarProps {
  onSearch?: (term: string) => void;
  onOpenUpload?: () => void;
  onSelectCategory?: (category: string) => void;
  activeCategory?: string;
  isSearchActive?: boolean;
}

export default function Navbar({
  onSearch,
  onOpenUpload,
  onSelectCategory,
  activeCategory = "Home",
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  // Derive currentCategory from pathname and activeCategory prop
  const currentCategory = pathname === "/youtube" ? "YouTube" : activeCategory;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const handleSelectNavCategory = (cat: string) => {
    if (cat === "YouTube") {
      setShowMobileDrawer(false);
      if (pathname !== "/youtube") {
        router.push("/youtube");
      }
      return;
    }

    if (pathname !== "/") {
      setShowMobileDrawer(false);
      router.push(`/?category=${encodeURIComponent(cat)}`);
      return;
    }

    if (onSelectCategory) {
      onSelectCategory(cat);
    }
    setShowMobileDrawer(false);
  };

  const navLinks = [
    "Home",
    "TV Shows",
    "Movies",
    "New & Popular",
    "YouTube",
    "My List",
    "Browse by Languages",
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#141414]/95 backdrop-blur-md shadow-2xl border-b border-zinc-900/60"
            : "bg-gradient-to-b from-black/95 via-black/60 to-transparent"
        }`}
      >
        {/* Main Navbar Bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 md:px-12 h-14 sm:h-16">
          {/* Left: Mobile Hamburger & Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-6 lg:gap-10">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setShowMobileDrawer(true)}
              className="md:hidden p-2 -ml-1 text-zinc-300 hover:text-white rounded-md active:bg-zinc-800 transition-colors"
              aria-label="Open mobile menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center group select-none">
              <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-[#E50914] drop-shadow-[0_2px_10px_rgba(229,9,20,0.6)] group-hover:scale-105 transition-transform duration-200">
                STREAMFLIX
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
              {navLinks.map((item) => {
                if (item === "YouTube") {
                  return (
                    <button
                      key={item}
                      onClick={() => handleSelectNavCategory(item)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                        currentCategory === "YouTube"
                          ? "bg-[#E50914] text-white shadow-lg shadow-red-600/50 scale-105"
                          : "bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white border border-red-500/40"
                      }`}
                      title="Explore YouTube on StreamFlix"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      <span>YouTube</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/50 text-white font-extrabold uppercase">
                        New
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item}
                    onClick={() => handleSelectNavCategory(item)}
                    className={`transition-colors duration-200 text-sm ${
                      currentCategory === item
                        ? "text-white font-bold"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Upload, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 text-white">
            {/* Quick Upload Button (Desktop & Tablet) */}
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 hover:bg-[#E50914] text-xs font-semibold transition-all duration-300 border border-zinc-700 hover:border-[#E50914] shadow-md hover:shadow-red-600/30"
                title="Upload New Video"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Upload</span>
              </button>
            )}

            {/* Desktop / In-bar Search bar */}
            <div className="relative flex items-center">
              {showSearch ? (
                <div className="hidden sm:flex items-center bg-black/90 border border-zinc-500 rounded-md px-2.5 py-1 text-sm transition-all duration-300 w-48 md:w-64">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Titles, genres, uploads..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoFocus
                    className="bg-transparent text-white placeholder-zinc-500 text-xs md:text-sm focus:outline-none w-full"
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                      if (onSearch) onSearch("");
                    }}
                    className="text-zinc-400 hover:text-white p-1"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                </div>
              ) : null}

              {/* Search Toggle Button */}
              <button
                onClick={() => setShowSearch((prev) => !prev)}
                className="text-zinc-200 hover:text-white p-2 rounded-full transition-transform active:scale-95"
                aria-label="Toggle search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Notifications Bell */}
            <div className="relative p-2 cursor-pointer hover:text-zinc-300 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#E50914] rounded-full ring-2 ring-black" />
            </div>

            {/* User Profile / Auth Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex items-center gap-1.5 focus:outline-none p-1 group"
                aria-label="User profile menu"
              >
                {/* Netflix Classic Avatar Icon */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-[1px] flex items-center justify-center shadow-md">
                  <div className="w-full h-full bg-[#1e1e1e] rounded-[5px] flex items-center justify-center font-bold text-xs text-white uppercase">
                    {session?.user?.email ? session.user.email[0] : "N"}
                  </div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`hidden sm:block w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform duration-200 ${
                    showProfileMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <>
                  {/* Backdrop to dismiss on outside click */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />

                  <div className="absolute right-0 mt-3 w-64 bg-[#141414]/98 border border-zinc-800 rounded-xl shadow-2xl py-2 text-sm z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    {session?.user ? (
                      <>
                        <div className="px-4 py-2.5 border-b border-zinc-800">
                          <p className="text-xs text-zinc-400">Signed in as</p>
                          <p className="font-semibold text-white truncate text-xs mt-0.5">
                            {session.user.email}
                          </p>
                        </div>

                        {onOpenUpload && (
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              onOpenUpload();
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-zinc-800/80 text-zinc-200 hover:text-white flex items-center gap-2.5 transition-colors"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Upload Video
                          </button>
                        )}

                        <div className="border-t border-zinc-800 my-1" />

                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-zinc-800/80 hover:text-red-300 font-medium transition-colors"
                        >
                          Sign Out of StreamFlix
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2 text-xs text-zinc-400">
                          Welcome to StreamFlix
                        </div>
                        <Link
                          href="/login"
                          onClick={() => setShowProfileMenu(false)}
                          className="block px-4 py-2.5 hover:bg-zinc-800 text-white font-medium transition-colors"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setShowProfileMenu(false)}
                          className="block px-4 py-2.5 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                        >
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Full-Width Search Overlay (When search active on mobile) */}
        {showSearch && (
          <div className="sm:hidden px-3 py-2 bg-black/95 border-t border-zinc-800 flex items-center gap-2 animate-in fade-in duration-150">
            <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search titles, genres, uploads..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
                className="bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    if (onSearch) onSearch("");
                  }}
                  className="text-zinc-400 hover:text-white p-1 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
                if (onSearch) onSearch("");
              }}
              className="text-xs font-semibold text-zinc-300 px-2 py-1.5"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Mobile Sub-Header Category Carousel (Like native Netflix mobile) */}
        <div className="md:hidden flex items-center gap-2 px-3 pb-2 pt-1 overflow-x-auto no-scrollbar scroll-smooth">
          {navLinks.map((item) => {
            const isYT = item === "YouTube";
            return (
              <button
                key={item}
                onClick={() => handleSelectNavCategory(item)}
                className={`flex-none px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border flex items-center gap-1 ${
                  currentCategory === item
                    ? isYT
                      ? "bg-[#E50914] text-white font-bold border-[#E50914] shadow-md shadow-red-600/40"
                      : "bg-white text-black font-bold border-white shadow-sm"
                    : isYT
                    ? "bg-red-950/60 text-red-200 border-red-800/80 font-bold active:bg-red-900"
                    : "bg-black/40 text-zinc-300 border-zinc-700/80 active:bg-zinc-800"
                }`}
              >
                {isYT && (
                  <svg className="w-3 h-3 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                )}
                <span>{item}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Mobile Drawer (Slide-out side navigation) */}
      {showMobileDrawer && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileDrawer(false)}
          />

          {/* Drawer Menu Content */}
          <div className="relative w-72 max-w-[80vw] bg-[#141414] border-r border-zinc-800 h-full p-5 flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-xl font-black tracking-wider text-[#E50914]">
                  STREAMFLIX
                </span>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-full transition-colors"
                  aria-label="Close mobile menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Profile Header in Drawer */}
              {session?.user ? (
                <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-gradient-to-tr from-rose-600 to-amber-500 p-[1px] flex items-center justify-center">
                    <div className="w-full h-full bg-[#1e1e1e] rounded-[5px] flex items-center justify-center font-bold text-sm text-white uppercase">
                      {session.user.email ? session.user.email[0] : "N"}
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-zinc-400">Welcome,</p>
                    <p className="text-xs font-bold text-white truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex-1 text-center py-2 bg-[#E50914] text-white rounded font-bold text-xs shadow"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex-1 text-center py-2 bg-zinc-800 text-zinc-200 hover:text-white rounded font-semibold text-xs border border-zinc-700"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2">
                  Browse
                </p>
                {navLinks.map((item) => {
                  const isYT = item === "YouTube";
                  return (
                    <button
                      key={item}
                      onClick={() => handleSelectNavCategory(item)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                        currentCategory === item
                          ? "bg-zinc-800 text-[#E50914] font-bold"
                          : isYT
                          ? "bg-red-950/30 text-red-300 hover:bg-zinc-900 font-semibold"
                          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isYT && (
                          <svg className="w-4 h-4 fill-current text-red-500" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        )}
                        <span>{item}</span>
                      </div>
                      {isYT && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold uppercase tracking-wider">
                          New
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-zinc-800 space-y-2">
              {onOpenUpload && (
                <button
                  onClick={() => {
                    setShowMobileDrawer(false);
                    onOpenUpload();
                  }}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-zinc-700 shadow-sm"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Upload New Video
                </button>
              )}

              {session && (
                <button
                  onClick={() => {
                    setShowMobileDrawer(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full py-2 text-red-400 hover:text-red-300 text-xs font-semibold text-left px-3 transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
