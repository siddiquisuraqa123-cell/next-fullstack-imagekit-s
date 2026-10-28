"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/MobileBottomNav";
import { apiClient } from "@/lib/api-client";
import { YouTubeVideoItem } from "@/types/youtube";
import YouTubePlayer from "../components/YouTubePlayer";
import {
  filterAvailableVideos,
  markVideoUnavailable,
  getUnavailableVideoIds,
  pickReplacementVideo,
} from "@/lib/unavailable-videos";


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

  // Active playing video (enables dedicated playback page view)
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoItem | null>(null);
  const [favorites, setFavorites] = useState<YouTubeVideoItem[]>([]);

  // Sticky video player state
  const [isSticky, setIsSticky] = useState(false);
  const playerSentinelRef = useRef<HTMLDivElement>(null);

  // Recommendations state for the active video
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideoItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Actions and description panel state
  const [copied, setCopied] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

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

  // Global event listener to prune any video marked unavailable anywhere across StreamFlix
  useEffect(() => {
    const handleUnavailable = (e: Event) => {
      const customEvent = e as CustomEvent<{ videoId: string }>;
      const badId = customEvent.detail?.videoId;
      if (badId) {
        setVideos((prev) => prev.filter((v) => v.id !== badId));
        setRelatedVideos((prev) => prev.filter((v) => v.id !== badId));
      }
    };
    window.addEventListener("streamflix_unavailable_video", handleUnavailable);
    return () => {
      window.removeEventListener("streamflix_unavailable_video", handleUnavailable);
    };
  }, []);

  // Primary fetch handler for browse grid with embeddable and region filtering
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

        const excludeList = Array.from(getUnavailableVideoIds());
        const res = await apiClient.searchYouTube(searchTerm, token, undefined, excludeList);
        const validVideos = filterAvailableVideos(res.videos || []);

        if (append) {
          setVideos((prev) => [...prev, ...validVideos]);
        } else {
          setVideos(validVideos);
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
    const excludeList = Array.from(getUnavailableVideoIds());
    apiClient
      .searchYouTube("trending movie trailers", undefined, undefined, excludeList)
      .then((res) => {
        if (!ignore) {
          const valid = filterAvailableVideos(res.videos || []);
          setVideos(valid);
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

  // Deep linking: check ?v= query parameter on mount and verify metadata
  useEffect(() => {
    let isCurrent = true;
    try {
      const params = new URLSearchParams(window.location.search);
      const vId = params.get("v");
      if (vId) {
        // If video is found in already loaded videos, use it
        const match = videos.find((v) => v.id === vId);
        if (match) {
          setSelectedVideo(match);
        } else {
          // Direct API lookup to fetch true title and verify embeddability status
          apiClient
            .getVideoById(vId)
            .then((res) => {
              if (!isCurrent) return;
              if (res.videos && res.videos.length > 0) {
                setSelectedVideo(res.videos[0]);
              } else {
                setSelectedVideo({
                  id: vId,
                  title: "YouTube Video",
                  description: "",
                  thumbnailUrl: `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
                  channelTitle: "YouTube Creator",
                  publishedAt: new Date().toISOString(),
                });
              }
            })
            .catch(() => {
              if (!isCurrent) return;
              setSelectedVideo({
                id: vId,
                title: "YouTube Video",
                description: "",
                thumbnailUrl: `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
                channelTitle: "YouTube Creator",
                publishedAt: new Date().toISOString(),
              });
            });
        }
      }
    } catch {
      // ignore
    }
    return () => {
      isCurrent = false;
    };
  }, [videos]);


  // Sync ?v= query param with active selectedVideo
  useEffect(() => {
    try {
      const currentUrl = new URL(window.location.href);
      if (selectedVideo) {
        currentUrl.searchParams.set("v", selectedVideo.id);
      } else {
        currentUrl.searchParams.delete("v");
      }
      window.history.replaceState(null, "", currentUrl.toString());
    } catch {
      // ignore
    }
  }, [selectedVideo?.id]);

  // Monitor scroll position to toggle compact sticky player
  useEffect(() => {
    if (!selectedVideo) {
      setIsSticky(false);
      return;
    }

    const handleScroll = () => {
      if (!playerSentinelRef.current) return;
      const rect = playerSentinelRef.current.getBoundingClientRect();
      // Account for fixed Navbar height (56px mobile, 64px desktop)
      const threshold = window.innerWidth >= 640 ? 64 : 56;
      setIsSticky(rect.top <= threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [selectedVideo]);

  // Fetch real related videos whenever selectedVideo changes
  useEffect(() => {
    if (!selectedVideo) {
      setRelatedVideos([]);
      return;
    }

    let ignore = false;
    setLoadingRelated(true);
    setShowFullDesc(false);
    setCopied(false);
    setShareNotice(null);

    const cleanTitleWords = selectedVideo.title
      .replace(/[\(\)\[\]\|:,-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !/^(official|trailer|teaser|video|hd|4k|movie)$/i.test(w));

    const primaryQuery =
      selectedVideo.channelTitle ||
      cleanTitleWords.slice(0, 3).join(" ") ||
      "trending movie trailers";

    const excludeList = [selectedVideo.id, ...Array.from(getUnavailableVideoIds())];

    apiClient
      .searchYouTube(primaryQuery, undefined, 12, excludeList)
      .then((res) => {
        if (ignore) return;
        const filtered = filterAvailableVideos(res.videos || []).filter(
          (v) => v.id !== selectedVideo.id
        );
        if (filtered.length === 0) {
          // Secondary fallback search
          return apiClient
            .searchYouTube("trending movie trailers", undefined, 8, excludeList)
            .then((res2) => {
              if (ignore) return;
              const secondFiltered = filterAvailableVideos(res2.videos || []).filter(
                (v) => v.id !== selectedVideo.id
              );
              setRelatedVideos(secondFiltered.slice(0, 8));
              setLoadingRelated(false);
            });
        } else {
          setRelatedVideos(filtered.slice(0, 8));
          setLoadingRelated(false);
        }
      })
      .catch(() => {
        if (ignore) return;
        const fallback = filterAvailableVideos(videos).filter((v) => v.id !== selectedVideo.id).slice(0, 8);
        setRelatedVideos(fallback);
        setLoadingRelated(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedVideo?.id, selectedVideo?.channelTitle, selectedVideo?.title, videos]);

  // Action: Find another video when current video is unavailable or user requests alternative
  const handleFindAnother = useCallback(async () => {
    if (!selectedVideo) return;
    markVideoUnavailable(selectedVideo.id);

    // 1. Check for valid candidate in relatedVideos or loaded videos
    const candidate =
      pickReplacementVideo(selectedVideo.id, relatedVideos) ||
      pickReplacementVideo(selectedVideo.id, videos);

    if (candidate) {
      setSelectedVideo(candidate);
      return;
    }

    // 2. Fetch fresh alternative matching title, topic, or query
    try {
      const cleanTitleWords = selectedVideo.title
        .replace(/[\(\)\[\]\|:,-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !/^(official|trailer|teaser|video|hd|4k|movie)$/i.test(w));

      const fallbackQuery =
        selectedVideo.channelTitle ||
        cleanTitleWords.slice(0, 2).join(" ") ||
        activeTopic ||
        query ||
        "trending movie trailers";

      const excludeList = [selectedVideo.id, ...Array.from(getUnavailableVideoIds())];
      const res = await apiClient.searchYouTube(fallbackQuery, undefined, 8, excludeList);
      const available = filterAvailableVideos(res.videos || []).filter(
        (v) => v.id !== selectedVideo.id
      );

      if (available.length > 0) {
        setSelectedVideo(available[0]);
        setRelatedVideos(available.slice(1));
      } else {
        const trRes = await apiClient.searchYouTube("trending movie trailers", undefined, 8, excludeList);
        const trAvailable = filterAvailableVideos(trRes.videos || []).filter(
          (v) => v.id !== selectedVideo.id
        );
        if (trAvailable.length > 0) {
          setSelectedVideo(trAvailable[0]);
          setRelatedVideos(trAvailable.slice(1));
        }
      }
    } catch (e) {
      console.warn("Could not find replacement video:", e);
    }
  }, [selectedVideo, relatedVideos, videos, activeTopic, query]);


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

  // Select video for playback
  const handleSelectVideo = (video: YouTubeVideoItem) => {
    setSelectedVideo(video);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Native share with clipboard fallback
  const handleShare = async () => {
    if (!selectedVideo) return;
    const videoUrl = `https://www.youtube.com/watch?v=${selectedVideo.id}`;
    const sharePayload = {
      title: selectedVideo.title,
      text: `Watch "${selectedVideo.title}" on StreamFlix`,
      url: videoUrl,
    };

    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      (!navigator.canShare || navigator.canShare(sharePayload))
    ) {
      try {
        await navigator.share(sharePayload);
        setShareNotice("Shared!");
        setTimeout(() => setShareNotice(null), 2500);
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(videoUrl);
      setShareNotice("Link Copied!");
      setTimeout(() => setShareNotice(null), 2500);
    } catch {
      setShareNotice("Copy failed");
      setTimeout(() => setShareNotice(null), 2000);
    }
  };

  // Copy link
  const handleCopyLink = async () => {
    if (!selectedVideo) return;
    const videoUrl = `https://www.youtube.com/watch?v=${selectedVideo.id}`;
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // Formatted publication date
  const formattedSelectedDate = selectedVideo?.publishedAt
    ? new Date(selectedVideo.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  // Channel avatar initial
  const channelInitial = (selectedVideo?.channelTitle || "Y").trim().charAt(0).toUpperCase();

  // Smart tag extraction based on title
  const selectedTags: string[] = [];
  if (selectedVideo) {
    const titleLower = selectedVideo.title.toLowerCase();
    if (titleLower.includes("trailer")) selectedTags.push("Official Trailer");
    else if (titleLower.includes("teaser")) selectedTags.push("Teaser");
    else if (titleLower.includes("behind")) selectedTags.push("Behind The Scenes");
    else if (titleLower.includes("review")) selectedTags.push("Review");
    else if (titleLower.includes("music") || titleLower.includes("song")) selectedTags.push("Music");
  }

  return (
    <div className="relative min-h-screen bg-[#141414] text-white flex flex-col selection:bg-[#E50914] selection:text-white">
      {/* Brand Navbar */}
      <Navbar activeCategory="YouTube" />

      {/* Main Container */}
      <main className="flex-1 pt-16 sm:pt-20 px-3 sm:px-6 md:px-12 max-w-7xl mx-auto w-full pb-20">
        {/* ========================================================================= */}
        {/* VIEW 1: DEDICATED VIDEO PLAYBACK PAGE WITH STICKY PLAYER WHILE SCROLLING */}
        {/* ========================================================================= */}
        {selectedVideo ? (
          <div className="space-y-6 pt-2 sm:pt-4">
            {/* Top Navigation Bar: Back to Browse */}
            <div className="flex items-center justify-between pb-1">
              <button
                onClick={() => setSelectedVideo(null)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white border border-zinc-800 transition-all active:scale-95 shadow-md group"
              >
                <svg
                  className="w-4 h-4 text-red-500 group-hover:-translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to YouTube Hub</span>
              </button>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">StreamFlix Theater Mode</span>
              </div>
            </div>

            {/* Sentinel Element for Intersection / Sticky Detection */}
            <div ref={playerSentinelRef} className="h-0 w-full" />

            {/* 1. PERSISTENT STICKY VIDEO PLAYER CONTAINER */}
            <div
              className={`sticky top-14 sm:top-16 z-30 transition-all duration-300 ease-in-out ${
                isSticky
                  ? "w-full bg-[#0a0f16]/95 backdrop-blur-md border-b border-[#1b2b3a] shadow-2xl py-2 px-3 sm:px-6 -mx-3 sm:-mx-6 md:-mx-12 rounded-b-xl ring-1 ring-white/10"
                  : "relative w-full py-0 px-0"
              }`}
            >
              <div
                className={`mx-auto transition-all duration-300 ease-in-out ${
                  isSticky
                    ? "max-w-7xl flex items-center justify-between gap-3 sm:gap-4"
                    : "max-w-5xl"
                }`}
              >
                {/* 16:9 Official YouTube Embedded Player: Resizes smoothly without unmounting */}
                <div
                  className={`transition-all duration-300 ease-in-out aspect-video bg-black overflow-hidden shadow-2xl ${
                    isSticky
                      ? "w-44 xs:w-56 sm:w-72 md:w-80 flex-shrink-0 rounded-lg border border-zinc-700/80 ring-1 ring-white/10"
                      : "w-full rounded-xl sm:rounded-2xl border border-[#1b2b3a]"
                  }`}
                >
                  <YouTubePlayer
                    video={selectedVideo}
                    isSticky={isSticky}
                    onFindAnother={handleFindAnother}
                    onUnavailable={(badId) => {
                      setVideos((prev) => prev.filter((v) => v.id !== badId));
                      setRelatedVideos((prev) => prev.filter((v) => v.id !== badId));
                    }}
                  />
                </div>


                {/* Compact Sticky Details & Quick Actions Bar */}
                {isSticky && (
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2 sm:gap-4 animate-in fade-in duration-200">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-red-600/20 border border-red-500/30 text-[9px] sm:text-[10px] font-black text-red-400 uppercase tracking-wider">
                          Now Playing
                        </span>
                        <span className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate hidden md:inline">
                          {selectedVideo.channelTitle}
                        </span>
                      </div>
                      <h3
                        className="text-xs sm:text-sm font-bold text-white truncate mt-0.5"
                        title={selectedVideo.title}
                      >
                        {selectedVideo.title}
                      </h3>
                    </div>

                    {/* Quick Action Icons in Sticky Bar */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      {/* Favorite Button */}
                      <button
                        onClick={() => handleToggleFavorite(selectedVideo)}
                        className={`p-2 rounded-lg border transition-colors active:scale-95 ${
                          favorites.some((v) => v.id === selectedVideo.id)
                            ? "bg-red-600/25 text-red-400 border-red-500/50 shadow-sm shadow-red-500/20"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white"
                        }`}
                        title={
                          favorites.some((v) => v.id === selectedVideo.id)
                            ? "Remove from Favorites"
                            : "Add to Favorites"
                        }
                        aria-label="Toggle Favorite"
                      >
                        <svg
                          className={`w-4 h-4 ${
                            favorites.some((v) => v.id === selectedVideo.id)
                              ? "fill-current"
                              : "fill-none"
                          }`}
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
                      </button>

                      {/* Scroll To Top (Expand View) */}
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors active:scale-95"
                        title="Expand Player (Scroll to top)"
                        aria-label="Scroll back to top"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </button>

                      {/* Close Player */}
                      <button
                        onClick={() => setSelectedVideo(null)}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-colors active:scale-95"
                        title="Close Player"
                        aria-label="Close Player"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. VIDEO INFORMATION & ACTION BUTTONS (In normal page flow) */}
            <div className="max-w-5xl mx-auto space-y-6 pt-1">
              <div className="space-y-3">
                {/* Badges & Tags Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600/20 border border-red-500/35 text-red-400 text-[11px] font-black uppercase tracking-wider shadow-sm">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span>YouTube Official</span>
                  </span>

                  <span className="px-2 py-0.5 rounded border border-zinc-700/80 bg-zinc-800/60 text-[10px] font-bold text-zinc-300">
                    HD 1080p
                  </span>

                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded border border-teal-500/35 bg-teal-500/10 text-[10px] font-semibold text-teal-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Dominant Video Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-sm pt-1">
                  {selectedVideo.title}
                </h1>

                {/* Channel & Publication Date */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 text-white font-black text-sm sm:text-base flex items-center justify-center shadow-lg ring-2 ring-white/10 flex-shrink-0"
                      aria-hidden="true"
                    >
                      {channelInitial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm sm:text-base text-zinc-100 truncate max-w-[220px] sm:max-w-md">
                          {selectedVideo.channelTitle}
                        </p>
                        <svg
                          className="w-4 h-4 text-teal-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-label="Verified Creator"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      {formattedSelectedDate && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Published {formattedSelectedDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 pb-1 border-t border-[#1b2b3a]/90">
                {/* Favorites Button */}
                <button
                  onClick={() => handleToggleFavorite(selectedVideo)}
                  className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 border active:scale-95 shadow-sm ${
                    favorites.some((v) => v.id === selectedVideo.id)
                      ? "bg-red-600/20 text-red-400 border-red-500/50 hover:bg-red-600/30 shadow-red-500/10"
                      : "bg-[#141f2d] hover:bg-[#1a283a] text-zinc-200 hover:text-white border-[#223548] hover:border-zinc-500"
                  }`}
                  aria-label={
                    favorites.some((v) => v.id === selectedVideo.id)
                      ? "Remove from Favorites"
                      : "Add to Favorites"
                  }
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      favorites.some((v) => v.id === selectedVideo.id)
                        ? "fill-red-500 text-red-500 scale-110"
                        : "fill-none text-current"
                    }`}
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
                  <span>
                    {favorites.some((v) => v.id === selectedVideo.id)
                      ? "Favorited"
                      : "Favorites"}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg bg-[#141f2d] hover:bg-[#1a283a] text-zinc-200 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200 border border-[#223548] hover:border-zinc-500 active:scale-95 shadow-sm"
                  aria-label="Share this video"
                >
                  {shareNotice ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  )}
                  <span>{shareNotice || "Share"}</span>
                </button>

                {/* Copy Link Button */}
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg bg-[#141f2d] hover:bg-[#1a283a] text-zinc-200 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200 border border-[#223548] hover:border-zinc-500 active:scale-95 shadow-sm"
                  aria-label="Copy YouTube video link"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>

                {/* Watch on YouTube Link */}
                <a
                  href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-400 hover:text-red-300 text-xs sm:text-sm font-bold transition-all duration-200 border border-red-500/35 hover:border-red-500/60 active:scale-95 ml-auto sm:ml-0 shadow-sm"
                  title="Watch directly on YouTube (external link)"
                  aria-label="Watch video directly on YouTube in new tab"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span>Watch on YouTube</span>
                  <svg className="w-3.5 h-3.5 stroke-current opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* 4. DESCRIPTION PANEL */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#101720] border border-[#1b2b3a] shadow-inner space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold border-b border-zinc-800/80 pb-2.5">
                  <span className="uppercase tracking-wider text-zinc-300 font-bold">About This Video</span>
                  {formattedSelectedDate && (
                    <span className="text-zinc-500 font-medium">Premiered {formattedSelectedDate}</span>
                  )}
                </div>

                {selectedVideo.description ? (
                  <div>
                    <p
                      className={`text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line ${
                        !showFullDesc ? "line-clamp-3" : ""
                      }`}
                    >
                      {selectedVideo.description}
                    </p>
                    {selectedVideo.description.length > 180 && (
                      <button
                        onClick={() => setShowFullDesc((prev) => !prev)}
                        className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        <span>{showFullDesc ? "Show Less" : "Show More"}</span>
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            showFullDesc ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-zinc-500 italic">
                    No description provided by creator.
                  </p>
                )}

                {/* Embed Reassurance Notice */}
                <div className="pt-2 border-t border-zinc-800/60 flex items-start gap-2.5 text-[11px] sm:text-xs text-zinc-400">
                  <svg
                    className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="leading-snug">
                    Playing via YouTube&apos;s official embedded player. If an external owner restricts third-party playback, click <strong className="text-zinc-200">&quot;Watch on YouTube&quot;</strong> to watch directly.
                  </p>
                </div>
              </div>

              {/* 5. RELATED RECOMMENDATIONS SECTION */}
              <section
                className="mt-8 pt-7 border-t-2 border-[#182635] space-y-5"
                aria-labelledby="related-heading"
              >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 pb-1">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-6 bg-gradient-to-b from-teal-400 to-[#E50914] rounded-full" />
                      <h2
                        id="related-heading"
                        className="text-lg sm:text-2xl font-black text-white tracking-tight uppercase"
                      >
                        More Like This
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1 pl-4">
                      Explore trailers, highlights, and related videos tailored to your taste
                    </p>
                  </div>

                  {!loadingRelated && relatedVideos.length > 0 && (
                    <span className="text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/25 px-2.5 py-1 rounded-full self-start sm:self-auto">
                      {relatedVideos.length} recommendations
                    </span>
                  )}
                </div>

                {/* Loading Skeletons */}
                {loadingRelated && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-[#101720] border border-[#1b2b3a] rounded-xl overflow-hidden animate-pulse flex flex-col"
                      >
                        <div className="aspect-video bg-zinc-800/70" />
                        <div className="p-3.5 space-y-2">
                          <div className="h-4 bg-zinc-800/80 rounded w-5/6" />
                          <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Related Videos Cards Grid */}
                {!loadingRelated && relatedVideos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
                    {relatedVideos.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectVideo(item)}
                        className="group relative bg-[#0f1722] hover:bg-[#152334] border border-[#1b2b3a] hover:border-teal-400/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 flex flex-col active:scale-98"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelectVideo(item);
                          }
                        }}
                        aria-label={`Play ${item.title}`}
                      >
                        {/* 16:9 Thumbnail */}
                        <div className="relative aspect-video w-full bg-black overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 filter brightness-95 group-hover:brightness-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />

                          {/* Center Play Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="w-11 h-11 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-2xl shadow-red-600/60 transform scale-75 group-hover:scale-100 transition-transform duration-300 pl-0.5">
                              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1 border border-zinc-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            <span>YouTube</span>
                          </div>
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-bold text-zinc-300 border border-zinc-700/60">
                            1080p
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <h3
                              className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug"
                              title={item.title}
                            >
                              {item.title}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
                            <span className="truncate font-medium max-w-[65%]" title={item.channelTitle}>
                              {item.channelTitle}
                            </span>
                            {item.publishedAt && (
                              <span className="text-[10px] text-zinc-500 flex-shrink-0">
                                {new Date(item.publishedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: YOUTUBE HUB BROWSE & SEARCH VIEW                                   */
          /* ========================================================================= */
          <>
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

                {/* Player Engine Badge */}
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
                      To search and display live YouTube videos, configure the <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-200 font-mono text-xs">YOUTUBE_API_KEY</code> environment variable on the server.
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

            {/* Video Cards Grid */}
            {!loading && videos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => handleSelectVideo(video)}
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
                        {video.publishedAt && (
                          <span className="text-[10px] text-zinc-500 flex-shrink-0">
                            {new Date(video.publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
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
          </>
        )}
      </main>

      {/* Brand Footer */}
      <Footer />

      {/* Mobile Native Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab="youtube"
        onHomeClick={() => {
          window.location.href = "/";
        }}
        onSearchClick={() => {
          if (selectedVideo) {
            setSelectedVideo(null);
          }
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
          if (selectedVideo) setSelectedVideo(null);
          handleSelectTopic("Trending Trailers");
        }}
        onProfileClick={() => {
          window.location.href = "/login";
        }}
      />
    </div>
  );
}
