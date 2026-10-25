"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import YouTubeModal from "../components/YouTubeModal";
import MobileBottomNav from "../components/MobileBottomNav";
import { apiClient } from "@/lib/api-client";
import { YouTubeVideoItem } from "@/types/youtube";

// Curated search tags for quick browsing
const POPULAR_TOPICS = [
  "Trending Trailers",
  "Blockbuster Movies",
  "Sci-Fi & Fantasy",
  "Action Thrillers",
  "Behind the Scenes",
  "Anime & Animation",
  "Netflix Specials",
  "Movie Reviews",
];

export default function YouTubePage() {
  const [query, setQuery] = useState("trending movie trailers");
  const [searchInput, setSearchInput] = useState("trending movie trailers");
  const [activeTopic, setActiveTopic] = useState("Trending Trailers");
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoItem | null>(null);
  const [favorites, setFavorites] = useState<YouTubeVideoItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyMissing, setIsKeyMissing] = useState(false);

  const [, startTransition] = useTransition();

  // Load Saved Favorites from LocalStorage on mount
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("streamflix_favorites");
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
    } catch (e) {
      console.warn("Could not load local storage favorites:", e);
    }

    const handleFavoritesSync = () => {
      try {
        const savedFavs = localStorage.getItem("streamflix_favorites");
        if (savedFavs) {
          setFavorites(JSON.parse(savedFavs));
        }
      } catch (e) {
        console.warn("Could not reload favorites:", e);
      }
    };

    window.addEventListener("streamflix_favorites_updated", handleFavoritesSync);
    window.addEventListener("storage", handleFavoritesSync);
    return () => {
      window.removeEventListener("streamflix_favorites_updated", handleFavoritesSync);
      window.removeEventListener("storage", handleFavoritesSync);
    };
  }, []);

  // Sync Favorites to LocalStorage
  const handleToggleFavorite = useCallback((video: YouTubeVideoItem) => {
    setFavorites((prev) => {
      const exists = prev.some((v) => v.id === video.id);
      let updated: YouTubeVideoItem[];
      if (exists) {
        updated = prev.filter((v) => v.id !== video.id);
      } else {
        updated = [video, ...prev];
      }
      try {
        localStorage.setItem("streamflix_favorites", JSON.stringify(updated));
        window.dispatchEvent(new Event("streamflix_favorites_updated"));
      } catch (e) {
        console.warn("Could not save favorites:", e);
      }
      return updated;
    });
  }, []);

  // Primary fetch handler
  const fetchVideos = useCallback(
    async (searchTerm: string, token?: string, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);
        setIsKeyMissing(false);

        const res = await apiClient.searchYouTube(searchTerm, token);

        if (append) {
          setVideos((prev) => [...prev, ...(res.videos || [])]);
        } else {
          setVideos(res.videos || []);
        }
        setNextPageToken(res.nextPageToken);
        if (res.isKeyMissing) {
          setIsKeyMissing(true);
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading YouTube videos.";

        // Attempt to parse JSON error message if returned by server
        try {
          const parsed = JSON.parse(errorMsg);
          setError(parsed.error || errorMsg);
          if (parsed.isKeyMissing) {
            setIsKeyMissing(true);
          }
        } catch {
          setError(errorMsg);
          if (errorMsg.includes("YOUTUBE_API_KEY") || errorMsg.includes("not configured")) {
            setIsKeyMissing(true);
          }
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    let ignore = false;
    apiClient
      .searchYouTube("trending movie trailers")
      .then((res) => {
        if (!ignore) {
          setVideos(res.videos || []);
          setNextPageToken(res.nextPageToken);
          if (res.isKeyMissing) {
            setIsKeyMissing(true);
          }
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load initial YouTube videos.";
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setActiveTopic("");
    startTransition(() => {
      fetchVideos(trimmed);
    });
  };

  const handleSelectTopic = (topic: string) => {
    setActiveTopic(topic);
    setSearchInput(topic);
    setQuery(topic);
    startTransition(() => {
      fetchVideos(topic);
    });
  };

  const handleLoadMore = () => {
    if (!nextPageToken || loadingMore) return;
    fetchVideos(query, nextPageToken, true);
  };

  return (
    <div className="relative min-h-screen bg-[#141414] text-white flex flex-col selection:bg-[#E50914] selection:text-white">
      {/* Brand Navbar */}
      <Navbar activeCategory="YouTube" />

      {/* Main Container */}
      <main className="flex-1 pt-20 sm:pt-24 px-3 sm:px-6 md:px-12 max-w-7xl mx-auto w-full pb-16">
        {/* Header Hero Section */}
        <section className="mb-8 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-5 rounded bg-[#E50914] flex items-center justify-center text-white shadow-md shadow-red-600/30">
                  <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="text-xs uppercase tracking-widest font-black text-red-500">
                  StreamFlix YouTube Hub
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                Watch YouTube on StreamFlix
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
                Browse official trailers, teasers, and creator videos in a cinematic Netflix-style layout, powered by the YouTube Data API v3.
              </p>
            </div>

            {/* Quick Stats or Badge */}
            <div className="hidden lg:flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-4 py-2.5 rounded-xl self-start">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-zinc-500">Player Engine</p>
                <p className="text-xs font-bold text-zinc-200">YouTube Official Embed</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search trailers, cinema, anime, reviews..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-[#181818] border border-zinc-700 hover:border-zinc-500 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 transition-colors outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                  aria-label="Clear search input"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#E50914] hover:bg-red-700 active:scale-95 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
            >
              <svg className="w-4 h-4 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>
          </form>

          {/* Popular Category Chips */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex-shrink-0 mr-1">
              Popular:
            </span>
            {POPULAR_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => handleSelectTopic(topic)}
                className={`flex-none px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                  activeTopic === topic
                    ? "bg-white text-black font-bold border-white shadow-md shadow-white/10"
                    : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800 active:scale-95"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        {/* Missing API Key Warning / Helper Banner */}
        {isKeyMissing && (
          <div className="mb-8 p-5 bg-gradient-to-r from-amber-950/60 to-zinc-900 border border-amber-600/50 rounded-xl shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-amber-300">
                  YouTube API Key Required
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  To search and display YouTube videos, configure the <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-200 font-mono text-xs">YOUTUBE_API_KEY</code> environment variable on the server.
                </p>
                <div className="text-xs text-zinc-400 space-y-1 pt-1 font-mono">
                  <p>1. Local dev: add <span className="text-amber-200">YOUTUBE_API_KEY=your_key</span> to <span className="text-zinc-200">.env.local</span></p>
                  <p>2. Vercel: add <span className="text-amber-200">YOUTUBE_API_KEY</span> in Project Settings → Environment Variables</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generic API Error Banner */}
        {error && !isKeyMissing && (
          <div className="mb-8 p-4 bg-red-950/50 border border-red-800/80 rounded-xl shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs sm:text-sm text-red-200">{error}</p>
            </div>
            <button
              onClick={() => fetchVideos(query)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-md transition-colors flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results Info */}
        {!loading && !error && videos.length > 0 && (
          <div className="mb-5 flex items-center justify-between text-xs text-zinc-400">
            <p>
              Showing results for <span className="text-white font-bold">&quot;{query}&quot;</span> ({videos.length} videos loaded)
            </p>
            <span className="text-[11px] text-zinc-500">Click any video to play</span>
          </div>
        )}

        {/* Initial Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg overflow-hidden animate-pulse flex flex-col"
              >
                <div className="aspect-video bg-zinc-800" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-5/6" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-16 sm:py-24 bg-zinc-900/30 rounded-2xl border border-zinc-800/60 p-8 space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">No YouTube videos found</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              We couldn&apos;t find any embeddable public videos matching &quot;{query}&quot;. Try a broader search term like &quot;Movie Trailers&quot; or &quot;Netflix&quot;.
            </p>
            <button
              onClick={() => handleSelectTopic("Trending Trailers")}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors inline-block"
            >
              Browse Trending Trailers
            </button>
          </div>
        )}

        {/* Video Cards Grid (Netflix-style) */}
        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="group relative bg-[#181818] border border-zinc-800/90 hover:border-zinc-600 rounded-lg overflow-hidden cursor-pointer active:scale-95 md:hover:scale-105 transition-all duration-300 shadow-lg flex flex-col"
              >
                {/* 16:9 Thumbnail Image */}
                <div className="relative aspect-video w-full bg-black overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    loading="lazy"
                    className="w-full h-full object-cover filter brightness-95 group-hover:brightness-105 transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* YouTube Tag */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1 border border-zinc-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span>YouTube</span>
                  </div>

                  {/* Quick Favorite Icon Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(video);
                    }}
                    className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all z-20 backdrop-blur-md ${
                      favorites.some((v) => v.id === video.id)
                        ? "bg-red-600/90 text-white shadow-md shadow-red-600/40"
                        : "bg-black/60 text-zinc-300 hover:text-white hover:bg-black/80"
                    }`}
                    aria-label={
                      favorites.some((v) => v.id === video.id)
                        ? "Remove Favorite"
                        : "Add to Favorites"
                    }
                    title={
                      favorites.some((v) => v.id === video.id)
                        ? "Remove Favorite"
                        : "Add to Favorites"
                    }
                  >
                    <svg
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        favorites.some((v) => v.id === video.id)
                          ? "fill-current"
                          : "fill-none stroke-current"
                      }`}
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>

                  {/* Play Button Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-11 h-11 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-xl shadow-red-600/40 transform group-hover:scale-110 transition-transform pl-0.5">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors"
                      title={video.title}
                    >
                      {video.title}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="truncate font-medium max-w-[65%]" title={video.channelTitle}>
                      {video.channelTitle}
                    </span>
                    <span className="text-[10px] text-zinc-500 flex-shrink-0">
                      {video.publishedAt
                        ? new Date(video.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && nextPageToken && (
          <div className="mt-10 sm:mt-12 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 disabled:opacity-50 text-white rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 border border-zinc-700 hover:border-zinc-500 shadow-xl flex items-center gap-2.5"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                  <span>Loading more videos...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>Load More Videos</span>
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Official YouTube Embedded Player Modal */}
      <YouTubeModal
        video={selectedVideo}
        isOpen={Boolean(selectedVideo)}
        onClose={() => setSelectedVideo(null)}
        isFavorite={selectedVideo ? favorites.some((v) => v.id === selectedVideo.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onSelectVideo={(v) => setSelectedVideo(v)}
      />

      {/* Brand Footer */}
      <Footer />

      {/* Mobile Native Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab="youtube"
        onHomeClick={() => {
          window.location.href = "/";
        }}
        onSearchClick={() => {
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (input) {
            input.focus();
            input.scrollIntoView({ behavior: "smooth" });
          }
        }}
        onUploadClick={() => {
          window.location.href = "/";
        }}
        onTrendingClick={() => {
          handleSelectTopic("Trending Trailers");
        }}
        onProfileClick={() => {
          window.location.href = "/login";
        }}
      />
    </div>
  );
}
