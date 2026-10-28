"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Sidebar, { SidebarTab } from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import FeaturedVideoBanner from "./components/FeaturedVideoBanner";
import CategoryChips, { CATEGORIES } from "./components/CategoryChips";
import VideoCarouselRow from "./components/VideoCarouselRow";
import YouTubeModal from "./components/YouTubeModal";
import UploadModal from "./components/UploadModal";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import { apiClient } from "@/lib/api-client";
import { YouTubeVideoItem } from "@/types/youtube";
import { IVideo } from "@/model/video";
import { filterAvailableVideos, getUnavailableVideoIds } from "@/lib/unavailable-videos";


export default function Home() {
  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<SidebarTab>("home");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [contentFilter, setContentFilter] = useState("All Videos");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Search State
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeVideoItem[]>([]);
  const [searchNextPage, setSearchNextPage] = useState<string | undefined>(undefined);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);

  // Video Rows Data
  const [featuredVideos, setFeaturedVideos] = useState<YouTubeVideoItem[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredVideo, setFeaturedVideo] = useState<YouTubeVideoItem | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<YouTubeVideoItem[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<YouTubeVideoItem[]>([]);
  const [entertainmentVideos, setEntertainmentVideos] = useState<YouTubeVideoItem[]>([]);
  const [gamingVideos, setGamingVideos] = useState<YouTubeVideoItem[]>([]);
  const [techVideos, setTechVideos] = useState<YouTubeVideoItem[]>([]);
  const [musicVideos, setMusicVideos] = useState<YouTubeVideoItem[]>([]);
  const [categoryResultVideos, setCategoryResultVideos] = useState<YouTubeVideoItem[]>([]);

  // User Database Uploads
  const [dbVideos, setDbVideos] = useState<IVideo[]>([]);

  // Active Selected Video for Playback Modal
  const [selectedYouTubeVideo, setSelectedYouTubeVideo] = useState<YouTubeVideoItem | null>(null);

  // LocalStorage User Lists: Favorites & Continue Watching
  const [favorites, setFavorites] = useState<YouTubeVideoItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<YouTubeVideoItem[]>([]);

  // Status / Feedback
  const [initialLoading, setInitialLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [isKeyMissing, setIsKeyMissing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  // Load Saved Favorites and Continue Watching from LocalStorage on mount
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("streamflix_favorites");
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
      const savedCW = localStorage.getItem("streamflix_continue_watching");
      if (savedCW) {
        setContinueWatching(JSON.parse(savedCW));
      }
    } catch (e) {
      console.warn("Could not load local storage data:", e);
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

  // Handle Video Click / Play & Record to Continue Watching
  const handlePlayVideo = useCallback((video: YouTubeVideoItem) => {
    setSelectedYouTubeVideo(video);
    setContinueWatching((prev) => {
      const filtered = prev.filter((v) => v.id !== video.id);
      const updated = [video, ...filtered].slice(0, 15);
      try {
        localStorage.setItem("streamflix_continue_watching", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save continue watching:", e);
      }
      return updated;
    });
  }, []);

  // Fetch Database Uploads from user backend
  const loadDbVideos = useCallback(async () => {
    try {
      const res = await apiClient.getVideos();
      if (Array.isArray(res)) {
        setDbVideos(res);
      }
    } catch (e) {
      console.warn("Could not fetch user database videos:", e);
    }
  }, []);

  // Prune any video marked unavailable anywhere across StreamFlix
  useEffect(() => {
    const handleUnavailable = (e: Event) => {
      const customEvent = e as CustomEvent<{ videoId: string }>;
      const badId = customEvent.detail?.videoId;
      if (!badId) return;

      setTrendingVideos((prev) => prev.filter((v) => v.id !== badId));
      setRecommendedVideos((prev) => prev.filter((v) => v.id !== badId));
      setFeaturedVideos((prev) => prev.filter((v) => v.id !== badId));
      setEntertainmentVideos((prev) => prev.filter((v) => v.id !== badId));
      setGamingVideos((prev) => prev.filter((v) => v.id !== badId));
      setTechVideos((prev) => prev.filter((v) => v.id !== badId));
      setMusicVideos((prev) => prev.filter((v) => v.id !== badId));
      setSearchResults((prev) => prev.filter((v) => v.id !== badId));
      setCategoryResultVideos((prev) => prev.filter((v) => v.id !== badId));
    };

    window.addEventListener("streamflix_unavailable_video", handleUnavailable);
    return () => {
      window.removeEventListener("streamflix_unavailable_video", handleUnavailable);
    };
  }, []);

  // Initial Data Fetch for Dashboard Rows & Featured Banner
  useEffect(() => {
    let ignore = false;

    async function loadDashboardCatalog() {
      try {
        const unavailable = Array.from(getUnavailableVideoIds());

        // Fetch Primary Trending & Recommended with India & embeddable filters
        const trendingRes = await apiClient.searchYouTube(
          "trending movie trailers 2024",
          undefined,
          12,
          unavailable
        );
        if (ignore) return;

        if (trendingRes.isKeyMissing) {
          setIsKeyMissing(true);
        }

        const tVideos = filterAvailableVideos(trendingRes.videos || []);
        setTrendingVideos(tVideos);
        if (tVideos.length > 0) {
          const heroSpotlights = tVideos.slice(0, 5);
          setFeaturedVideos(heroSpotlights);
          setFeaturedVideo(heroSpotlights[0]);
          setFeaturedIndex(0);
          setRecommendedVideos(tVideos.slice(1));
        }

        // Fetch Secondary Rows (Entertainment, Gaming, Tech, Music) in parallel with excludeList
        const [entRes, gameRes, techRes, musicRes] = await Promise.allSettled([
          apiClient.searchYouTube("official cinema blockbusters and trailers", undefined, 10, unavailable),
          apiClient.searchYouTube("grand theft auto elden ring black myth gaming trailers", undefined, 10, unavailable),
          apiClient.searchYouTube("apple vision pro spacex starship atlas technology", undefined, 10, unavailable),
          apiClient.searchYouTube("top music videos concerts live official", undefined, 10, unavailable),
        ]);

        if (ignore) return;

        if (entRes.status === "fulfilled" && entRes.value?.videos) {
          setEntertainmentVideos(filterAvailableVideos(entRes.value.videos));
        }
        if (gameRes.status === "fulfilled" && gameRes.value?.videos) {
          setGamingVideos(filterAvailableVideos(gameRes.value.videos));
        }
        if (techRes.status === "fulfilled" && techRes.value?.videos) {
          setTechVideos(filterAvailableVideos(techRes.value.videos));
        }
        if (musicRes.status === "fulfilled" && musicRes.value?.videos) {
          setMusicVideos(filterAvailableVideos(musicRes.value.videos));
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load dashboard videos";
          setApiError(msg);
        }
      } finally {
        if (!ignore) {
          setInitialLoading(false);
        }
      }
    }

    loadDashboardCatalog();
    loadDbVideos();

    return () => {
      ignore = true;
    };
  }, [loadDbVideos]);

  // Execute Search
  const performSearch = useCallback(async (query: string, pageToken?: string, append = false) => {
    if (!query.trim()) return;
    try {
      if (append) {
        setSearchLoadingMore(true);
      } else {
        setSearchLoading(true);
      }
      setApiError(null);

      const unavailable = Array.from(getUnavailableVideoIds());
      const res = await apiClient.searchYouTube(query, pageToken, 18, unavailable);
      const validVideos = filterAvailableVideos(res.videos || []);

      if (append) {
        setSearchResults((prev) => [...prev, ...validVideos]);
      } else {
        setSearchResults(validVideos);
      }
      setSearchNextPage(res.nextPageToken);
      if (res.isKeyMissing) {
        setIsKeyMissing(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search query failed";
      setApiError(msg);
    } finally {
      setSearchLoading(false);
      setSearchLoadingMore(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    setActiveSearch(query);
    setActiveTab("search");
    startTransition(() => {
      performSearch(query);
    });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setSearchResults([]);
    setActiveTab("home");
  };

  // Handle Category Chip Click
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === "All") {
      setCategoryResultVideos([]);
      if (trendingVideos.length > 0) {
        const heroSpotlights = trendingVideos.slice(0, 5);
        setFeaturedVideos(heroSpotlights);
        setFeaturedVideo(heroSpotlights[0]);
        setFeaturedIndex(0);
      }
      return;
    }

    setCategoryLoading(true);
    startTransition(async () => {
      try {
        const queryTerm = `${cat} official trailers and popular videos`;
        const unavailable = Array.from(getUnavailableVideoIds());
        const res = await apiClient.searchYouTube(queryTerm, undefined, 15, unavailable);
        const catVideos = filterAvailableVideos(res.videos || []);
        setCategoryResultVideos(catVideos);
        if (catVideos.length > 0) {
          const heroSpotlights = catVideos.slice(0, 5);
          setFeaturedVideos(heroSpotlights);
          setFeaturedVideo(heroSpotlights[0]);
          setFeaturedIndex(0);
        }
      } catch (err) {
        console.warn("Category fetch failed:", err);
      } finally {
        setCategoryLoading(false);
      }
    });
  };


  // Handle Content Filter Dropdown Change
  const handleContentFilterChange = (filter: string) => {
    setContentFilter(filter);
    if (filter === "All Videos") {
      setSelectedCategory("All");
      setCategoryResultVideos([]);
    } else {
      handleSelectCategory(filter.replace("&", "").split(" ")[0]);
    }
  };

  const favoriteIds = favorites.map((v) => v.id);

  return (
    <div className="min-h-screen bg-[#090e13] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-black">
      <div className="flex-1 flex w-full">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === "home") {
              setActiveSearch("");
              setSearchInput("");
              setSelectedCategory("All");
              setCategoryResultVideos([]);
            } else if (tab === "trending") {
              handleSelectCategory("Trending");
            } else if (tab === "categories") {
              const el = document.getElementById("category-chips-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }
          }}
          onOpenUpload={() => setIsUploadOpen(true)}
          favoritesCount={favorites.length}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Dashboard Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Sticky Header */}
          <DashboardHeader
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={handleSearchSubmit}
            onClearSearch={handleClearSearch}
            selectedFilter={contentFilter}
            onSelectFilter={handleContentFilterChange}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onOpenUpload={() => setIsUploadOpen(true)}
            loading={searchLoading}
          />

          <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-12 space-y-6">
            {/* API Key Missing Notice */}
            {isKeyMissing && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-[#111a22] to-[#121c27] border border-amber-600/40 shadow-xl flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <h4 className="font-bold text-amber-300">Preview Mode Active</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Showing authentic preview trailers so you can test search and the embedded player right away. To unlock live YouTube search queries, configure <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-200 font-mono text-xs">YOUTUBE_API_KEY</code> in <span className="text-white font-semibold">.env.local</span> or your Vercel dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {apiError && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-center justify-between">
                <span>{apiError}</span>
                <button
                  onClick={() => setApiError(null)}
                  className="text-xs text-red-400 hover:text-white underline ml-3"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* VIEW 1: ACTIVE SEARCH RESULTS */}
            {activeTab === "search" && activeSearch && (
              <section className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#182635] pb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Search results for <span className="text-teal-400">&quot;{activeSearch}&quot;</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchResults.length} videos found matching your query
                    </p>
                  </div>
                  <button
                    onClick={handleClearSearch}
                    className="px-3 py-1.5 rounded-lg bg-[#111c27] hover:bg-[#182737] text-xs font-bold text-slate-300 transition-colors border border-[#1b2b3a]"
                  >
                    Clear Search
                  </button>
                </div>

                {searchLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div key={idx} className="rounded-2xl bg-[#0f1722] border border-[#1a2838] overflow-hidden animate-pulse">
                        <div className="aspect-video bg-[#152332]" />
                        <div className="p-3.5 space-y-2">
                          <div className="h-4 bg-[#182636] rounded w-5/6" />
                          <div className="h-3 bg-[#152332] rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                      {searchResults.map((video) => (
                        <div
                          key={video.id}
                          onClick={() => handlePlayVideo(video)}
                          className="group relative rounded-2xl bg-[#0f1722] hover:bg-[#121d2a] border border-[#192736] hover:border-teal-500/50 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col active:scale-95 md:hover:scale-[1.03]"
                        >
                          <div className="relative aspect-video w-full bg-[#0a0f14] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              loading="lazy"
                              className="w-full h-full object-cover filter brightness-95 group-hover:brightness-105 group-hover:scale-105 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1722] via-transparent to-black/30 opacity-70 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-black text-red-500 uppercase tracking-wider border border-white/10">
                              YouTube
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="w-10 h-10 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-xl pl-0.5">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="p-3.5 flex-1 flex flex-col justify-between">
                            <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-teal-300 line-clamp-2">
                              {video.title}
                            </h3>
                            <div className="mt-2.5 pt-2 border-t border-[#182635] flex items-center justify-between text-[11px] text-slate-400">
                              <span className="truncate max-w-[70%] font-medium">{video.channelTitle}</span>
                              <span className="text-[10px] text-slate-500">
                                {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {searchNextPage && (
                      <div className="pt-6 flex justify-center">
                        <button
                          onClick={() => performSearch(activeSearch, searchNextPage, true)}
                          disabled={searchLoadingMore}
                          className="px-6 py-2.5 rounded-xl bg-[#111c27] hover:bg-[#182737] text-white text-xs font-bold border border-[#1b2b3a] transition-all flex items-center gap-2"
                        >
                          {searchLoadingMore ? "Loading more..." : "Load More Search Results"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 bg-[#0e1620] rounded-2xl border border-[#182635] p-6 space-y-3">
                    <p className="text-slate-300 font-bold">No videos found matching &quot;{activeSearch}&quot;</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try searching with different keywords like &quot;Trailers&quot;, &quot;Cinema&quot;, or &quot;Anime&quot;.
                    </p>
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold"
                    >
                      Return to Home
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* VIEW 2: FAVORITES LIST */}
            {activeTab === "favorites" && (
              <section className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-[#182635] pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                      <span className="text-red-500">♥</span> Your Favorites
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {favorites.length} saved YouTube videos ready to stream
                    </p>
                  </div>
                  {favorites.length > 0 && (
                    <button
                      onClick={() => {
                        setFavorites([]);
                        localStorage.removeItem("streamflix_favorites");
                      }}
                      className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {favorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {favorites.map((video) => (
                      <div
                        key={video.id}
                        onClick={() => handlePlayVideo(video)}
                        className="group relative rounded-2xl bg-[#0f1722] hover:bg-[#121d2a] border border-[#192736] hover:border-red-500/50 shadow-lg cursor-pointer overflow-hidden flex flex-col active:scale-95 transition-all"
                      >
                        <div className="relative aspect-video w-full bg-[#0a0f14] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-all"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(video);
                            }}
                            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md"
                            title="Remove Favorite"
                          >
                            ♥
                          </button>
                        </div>
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-300 line-clamp-2">
                            {video.title}
                          </h3>
                          <div className="mt-2 pt-2 border-t border-[#182635] text-[11px] text-slate-400 truncate">
                            {video.channelTitle}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-[#0e1620] rounded-2xl border border-[#182635] p-6 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#14202c] flex items-center justify-center text-slate-500">
                      ♥
                    </div>
                    <p className="text-slate-300 font-bold">No favorite videos saved yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Click the favorite heart icon on any video card or banner to build your personal streaming library.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* VIEW 3: CONTINUE WATCHING */}
            {activeTab === "continue" && (
              <section className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-[#182635] pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                      <span className="text-teal-400">⏱</span> Continue Watching
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Pick up where you left off from your recent sessions
                    </p>
                  </div>
                  {continueWatching.length > 0 && (
                    <button
                      onClick={() => {
                        setContinueWatching([]);
                        localStorage.removeItem("streamflix_continue_watching");
                      }}
                      className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                {continueWatching.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {continueWatching.map((video) => (
                      <div
                        key={video.id}
                        onClick={() => handlePlayVideo(video)}
                        className="group relative rounded-2xl bg-[#0f1722] hover:bg-[#121d2a] border border-[#192736] hover:border-teal-500/50 shadow-lg cursor-pointer overflow-hidden flex flex-col active:scale-95 transition-all"
                      >
                        <div className="relative aspect-video w-full bg-[#0a0f14] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-all"
                          />
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-teal-500" />
                        </div>
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-teal-300 line-clamp-2">
                            {video.title}
                          </h3>
                          <div className="mt-2 pt-2 border-t border-[#182635] text-[11px] text-slate-400 truncate">
                            {video.channelTitle}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-[#0e1620] rounded-2xl border border-[#182635] p-6 space-y-3">
                    <p className="text-slate-300 font-bold">No watched videos in history</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Videos you watch will automatically be saved here so you can easily return to them anytime.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* VIEW 4: MY UPLOADS (ImageKit & Database Videos) */}
            {activeTab === "uploads" && (
              <section className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-[#182635] pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                      <span className="text-teal-400">☁</span> Your Video Uploads
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Videos stored in your MongoDB database and streamed via ImageKit
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                  >
                    <span>+ Upload Video</span>
                  </button>
                </div>

                {dbVideos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {dbVideos.map((video, idx) => (
                      <div
                        key={video._id ? String(video._id) : idx}
                        onClick={() => {
                          // Format db video as playable item
                          setSelectedYouTubeVideo({
                            id: String(video._id || idx),
                            title: video.title,
                            description: video.description || "",
                            thumbnailUrl: video.thumbnailUrl,
                            channelTitle: "Your Uploads",
                            publishedAt: new Date().toISOString(),
                          });
                        }}
                        className="group relative rounded-2xl bg-[#0f1722] hover:bg-[#121d2a] border border-[#192736] hover:border-teal-500/50 shadow-lg cursor-pointer overflow-hidden flex flex-col active:scale-95 transition-all"
                      >
                        <div className="relative aspect-video w-full bg-[#0a0f14] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-all"
                          />
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-teal-600 text-white text-[9px] font-bold uppercase tracking-wider">
                            ImageKit Stream
                          </div>
                        </div>
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-teal-300 line-clamp-2">
                            {video.title}
                          </h3>
                          <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                            {video.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-[#0e1620] rounded-2xl border border-[#182635] p-6 space-y-3">
                    <p className="text-slate-300 font-bold">You haven&apos;t uploaded any videos yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Use the upload tool to publish your own high-definition videos directly to ImageKit and MongoDB.
                    </p>
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold"
                    >
                      Upload First Video
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* VIEW 5: DEFAULT HOME DASHBOARD */}
            {activeTab === "home" && (
              <div className="space-y-6">
                {/* 1. Large Featured YouTube Video Banner */}
                <FeaturedVideoBanner
                  videos={featuredVideos.length > 0 ? featuredVideos : featuredVideo ? [featuredVideo] : []}
                  video={featuredVideo}
                  currentIndex={featuredIndex}
                  onIndexChange={(idx) => {
                    setFeaturedIndex(idx);
                    if (featuredVideos[idx]) {
                      setFeaturedVideo(featuredVideos[idx]);
                    }
                  }}
                  favoriteIds={favoriteIds}
                  onPlay={handlePlayVideo}
                  onToggleFavorite={handleToggleFavorite}
                />

                {/* 2. Horizontally Scrollable Category Chips */}
                <div id="category-chips-section">
                  <CategoryChips
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleSelectCategory}
                  />
                </div>

                {/* If a category is selected and has results: Show Category Row */}
                {selectedCategory !== "All" && (
                  <VideoCarouselRow
                    title={`${selectedCategory} Highlights`}
                    subtitle={`Curated YouTube videos in ${selectedCategory}`}
                    videos={categoryResultVideos}
                    onPlay={handlePlayVideo}
                    favorites={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                    loading={categoryLoading}
                  />
                )}

                {/* 3. Horizontal Scrollable Video Rows */}
                {/* Row 1: Recommended For You */}
                <VideoCarouselRow
                  title="Recommended for You"
                  subtitle="Top picks based on global trending cinema"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  }
                  videos={recommendedVideos}
                  onPlay={handlePlayVideo}
                  favorites={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  loading={initialLoading}
                />

                {/* Row 2: Trending Videos */}
                <VideoCarouselRow
                  title="Trending Videos"
                  subtitle="Most watched official releases right now"
                  icon={
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  }
                  videos={trendingVideos}
                  onPlay={handlePlayVideo}
                  favorites={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  loading={initialLoading}
                />

                {/* Row 3: Entertainment & Cinema */}
                <VideoCarouselRow
                  title="Entertainment & Blockbusters"
                  subtitle="Latest movie trailers, teasers, and franchise spotlights"
                  icon={
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  }
                  videos={entertainmentVideos}
                  onPlay={handlePlayVideo}
                  favorites={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  loading={initialLoading}
                />

                {/* Row 4: Gaming & Esports */}
                <VideoCarouselRow
                  title="Gaming Highlights"
                  subtitle="Trailers, gameplay reveals, and gaming spectacles"
                  icon={
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  }
                  videos={gamingVideos}
                  onPlay={handlePlayVideo}
                  favorites={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  loading={initialLoading}
                />

                {/* Row 5: Technology & Innovation */}
                <VideoCarouselRow
                  title="Technology & Future"
                  subtitle="Spacecraft, robotics, and next-generation computing"
                  icon={
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                  videos={techVideos}
                  onPlay={handlePlayVideo}
                  favorites={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  loading={initialLoading}
                />

                {/* Row 6: Music & Performances */}
                <VideoCarouselRow
                  title="Music & Live Performances"
                  subtitle="Timeless hits, concerts, and music video releases"
                  icon={
                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  }
                  videos={musicVideos}
                  onPlay={handlePlayVideo}
                  favorites={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  loading={initialLoading}
                />

                {/* User Database Uploads Row if available */}
                {dbVideos.length > 0 && (
                  <section className="my-8">
                    <div className="flex items-center justify-between mb-3.5 px-1">
                      <div>
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                          <span>✨ Your Uploaded Originals</span>
                          <span className="text-xs text-teal-400 font-semibold">({dbVideos.length})</span>
                        </h2>
                        <p className="text-xs text-slate-400">Streamed via your ImageKit CDN endpoint</p>
                      </div>
                    </div>
                    <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1">
                      {dbVideos.map((video, idx) => (
                        <div
                          key={video._id ? String(video._id) : idx}
                          onClick={() => {
                            setSelectedYouTubeVideo({
                              id: String(video._id || idx),
                              title: video.title,
                              description: video.description || "",
                              thumbnailUrl: video.thumbnailUrl,
                              channelTitle: "Your Uploads",
                              publishedAt: new Date().toISOString(),
                            });
                          }}
                          className="w-[260px] flex-none rounded-2xl bg-[#0f1722] hover:bg-[#121d2a] border border-[#192736] hover:border-teal-500/50 shadow-lg cursor-pointer overflow-hidden flex flex-col active:scale-95 transition-all"
                        >
                          <div className="relative aspect-video w-full bg-[#0a0f14]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover filter brightness-95"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-teal-600 text-white text-[9px] font-bold">
                              ImageKit
                            </div>
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <h3 className="text-xs font-bold text-white truncate">{video.title}</h3>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">{video.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>

      {/* Official YouTube Embedded Player Modal */}
      <YouTubeModal
        video={selectedYouTubeVideo}
        isOpen={Boolean(selectedYouTubeVideo)}
        onClose={() => setSelectedYouTubeVideo(null)}
        isFavorite={selectedYouTubeVideo ? favorites.some((v) => v.id === selectedYouTubeVideo.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onSelectVideo={handlePlayVideo}
      />

      {/* ImageKit / Video Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          loadDbVideos();
        }}
      />

      {/* Mobile Bottom Navigation Dock */}
      <MobileBottomNav
        activeTab={activeTab === "favorites" ? "favorites" : activeTab === "search" ? "search" : "home"}
        onHomeClick={() => setActiveTab("home")}
        onSearchClick={() => {
          setActiveTab("search");
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (input) input.focus();
        }}
        onUploadClick={() => setIsUploadOpen(true)}
        onTrendingClick={() => handleSelectCategory("Trending")}
        onProfileClick={() => {
          window.location.href = "/login";
        }}
      />
    </div>
  );
}
