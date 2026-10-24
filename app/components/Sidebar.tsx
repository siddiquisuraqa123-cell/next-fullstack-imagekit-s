"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export type SidebarTab =
  | "home"
  | "search"
  | "favorites"
  | "trending"
  | "categories"
  | "uploads"
  | "continue";

interface SidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  onOpenUpload: () => void;
  favoritesCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  onOpenUpload,
  favoritesCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const { data: session } = useSession();

  const navItems = [
    {
      id: "home" as SidebarTab,
      label: "Home",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "search" as SidebarTab,
      label: "Search",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: "trending" as SidebarTab,
      label: "Trending",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
    },
    {
      id: "favorites" as SidebarTab,
      label: "Favorites",
      badge: favoritesCount > 0 ? favoritesCount : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      id: "categories" as SidebarTab,
      label: "Categories",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "continue" as SidebarTab,
      label: "Continue Watching",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "uploads" as SidebarTab,
      label: "My Uploads",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
  ];

  const handleTabClick = (tabId: SidebarTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 text-slate-300">
      {/* Brand & Logo */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2.5 group select-none">
            {/* StreamFlix Red Emblem */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E50914] to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white flex items-center gap-1">
                STREAM<span className="text-[#E50914]">FLIX</span>
              </span>
              <p className="text-[10px] text-teal-400 font-semibold tracking-wider uppercase">
                YouTube Hub
              </p>
            </div>
          </Link>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 pb-1">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? "bg-teal-500/15 text-teal-300 shadow-sm border border-teal-500/30 font-bold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-[#131d27]/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors duration-200 ${
                      isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E50914] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Upload Video Action */}
        <div className="pt-2">
          <button
            onClick={() => {
              onOpenUpload();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-teal-900/40"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Video</span>
          </button>
        </div>
      </div>

      {/* Sidebar Footer: User Account / Profile */}
      <div className="pt-4 border-t border-[#1a2835]/80 space-y-3">
        {session?.user ? (
          <div className="p-2.5 bg-[#121c27] rounded-xl border border-[#1b2b3a] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 p-[1px] flex items-center justify-center flex-shrink-0">
                <div className="w-full h-full bg-[#0d1620] rounded-[7px] flex items-center justify-center font-bold text-xs text-white uppercase">
                  {session.user.email ? session.user.email[0] : "U"}
                </div>
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-200 truncate">{session.user.email}</p>
                <p className="text-[10px] text-teal-400">Authenticated</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link
              href="/login"
              className="flex-1 text-center py-2 bg-[#E50914] hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-md transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex-1 text-center py-2 bg-[#14202c] hover:bg-[#1a2a3b] text-slate-200 hover:text-white rounded-lg font-semibold text-xs border border-[#1e3042] transition-colors"
            >
              Register
            </Link>
          </div>
        )}

        <div className="text-[10px] text-slate-500 text-center font-medium">
          StreamFlix YouTube Dashboard v2.0
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#0c131a] border-r border-[#182635] h-screen sticky top-0 flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#0c131a] border-r border-[#182635] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
