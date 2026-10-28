"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { YouTubeVideoItem } from "@/types/youtube";
import { apiClient } from "@/lib/api-client";
import YouTubePlayer from "./YouTubePlayer";
import {
  filterAvailableVideos,
  markVideoUnavailable,
  getUnavailableVideoIds,
  pickReplacementVideo,
} from "@/lib/unavailable-videos";


export interface YouTubeModalProps {
  video: YouTubeVideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (video: YouTubeVideoItem) => void;
  onSelectVideo?: (video: YouTubeVideoItem) => void;
}

export default function YouTubeModal({
  video,
  isOpen,
  onClose,
  isFavorite: isFavoriteProp,
  onToggleFavorite,
  onSelectVideo,
}: YouTubeModalProps) {
  // Active playing video (defaults to video prop, updates cleanly on recommendation click)
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideoItem | null>(video);

  const [copied, setCopied] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [localFav, setLocalFav] = useState(false);

  // Recommendations state
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideoItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal currentVideo when video prop changes from parent
  useEffect(() => {
    setCurrentVideo(video);
  }, [video]);

  // Sync favorites state from prop or localStorage
  useEffect(() => {
    if (!currentVideo) return;

    if (typeof isFavoriteProp === "boolean") {
      setLocalFav(isFavoriteProp);
      return;
    }

    try {
      const raw = localStorage.getItem("streamflix_favorites");
      if (raw) {
        const parsed: YouTubeVideoItem[] = JSON.parse(raw);
        setLocalFav(parsed.some((v) => v.id === currentVideo.id));
      } else {
        setLocalFav(false);
      }
    } catch {
      setLocalFav(false);
    }
  }, [currentVideo, isFavoriteProp]);

  // Close modal on Escape key and lock document scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Reset scroll and action feedback when video changes
  useEffect(() => {
    setShowFullDesc(false);
    setCopied(false);
    setShareNotice(null);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentVideo?.id]);

  // Prune any video marked unavailable anywhere across StreamFlix
  useEffect(() => {
    const handleUnavailable = (e: Event) => {
      const customEvent = e as CustomEvent<{ videoId: string }>;
      const badId = customEvent.detail?.videoId;
      if (badId) {
        setRelatedVideos((prev) => prev.filter((v) => v.id !== badId));
      }
    };
    window.addEventListener("streamflix_unavailable_video", handleUnavailable);
    return () => {
      window.removeEventListener("streamflix_unavailable_video", handleUnavailable);
    };
  }, []);

  // Fetch real related videos from YouTube API route with embeddability and region validation
  useEffect(() => {
    if (!isOpen || !currentVideo) {
      setRelatedVideos([]);
      return;
    }

    let ignore = false;
    setLoadingRelated(true);
    setRelatedError(null);

    // Build intelligent query based on channel or title keywords
    const cleanTitleWords = currentVideo.title
      .replace(/[\(\)\[\]\|:,-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !/^(official|trailer|teaser|video|hd|4k|movie)$/i.test(w));

    const primaryQuery =
      currentVideo.channelTitle ||
      cleanTitleWords.slice(0, 3).join(" ") ||
      "trending movie trailers";

    const excludeList = [currentVideo.id, ...Array.from(getUnavailableVideoIds())];

    apiClient
      .searchYouTube(primaryQuery, undefined, 10, excludeList)
      .then((res) => {
        if (ignore) return;
        const filtered = filterAvailableVideos(res.videos || []).filter(
          (v) => v.id !== currentVideo.id
        );

        if (filtered.length === 0) {
          // Secondary fallback search if channel/title query returned only current video
          return apiClient
            .searchYouTube("trending movie trailers", undefined, 8, excludeList)
            .then((fallbackRes) => {
              if (ignore) return;
              const secondFiltered = filterAvailableVideos(fallbackRes.videos || []).filter(
                (v) => v.id !== currentVideo.id
              );
              setRelatedVideos(secondFiltered.slice(0, 8));
              setLoadingRelated(false);
            });
        } else {
          setRelatedVideos(filtered.slice(0, 8));
          setLoadingRelated(false);
        }
      })
      .catch((err) => {
        if (ignore) return;
        setRelatedError(
          err instanceof Error ? err.message : "Failed to load related videos."
        );
        setLoadingRelated(false);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, currentVideo?.id, currentVideo?.channelTitle, currentVideo?.title]);

  // Action: Find another video when current video fails playback or user requests alternative
  const handleFindAnother = useCallback(async () => {
    if (!currentVideo) return;
    markVideoUnavailable(currentVideo.id);

    // 1. Immediately try to pick next available candidate from relatedVideos
    const candidate = pickReplacementVideo(currentVideo.id, relatedVideos);
    if (candidate) {
      setCurrentVideo(candidate);
      if (onSelectVideo) onSelectVideo(candidate);
      return;
    }

    // 2. If no valid candidate in relatedVideos, fetch fresh alternative videos
    try {
      const cleanTitleWords = currentVideo.title
        .replace(/[\(\)\[\]\|:,-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !/^(official|trailer|teaser|video|hd|4k|movie)$/i.test(w));

      const fallbackQuery =
        currentVideo.channelTitle ||
        cleanTitleWords.slice(0, 2).join(" ") ||
        "trending movie trailers";

      const excludeList = [currentVideo.id, ...Array.from(getUnavailableVideoIds())];
      const res = await apiClient.searchYouTube(fallbackQuery, undefined, 8, excludeList);
      const available = filterAvailableVideos(res.videos || []).filter(
        (v) => v.id !== currentVideo.id
      );

      if (available.length > 0) {
        setCurrentVideo(available[0]);
        setRelatedVideos(available.slice(1));
        if (onSelectVideo) onSelectVideo(available[0]);
      } else {
        const trRes = await apiClient.searchYouTube("trending movie trailers", undefined, 8, excludeList);
        const trAvailable = filterAvailableVideos(trRes.videos || []).filter(
          (v) => v.id !== currentVideo.id
        );
        if (trAvailable.length > 0) {
          setCurrentVideo(trAvailable[0]);
          setRelatedVideos(trAvailable.slice(1));
          if (onSelectVideo) onSelectVideo(trAvailable[0]);
        }
      }
    } catch (e) {
      console.warn("Could not find replacement video:", e);
    }
  }, [currentVideo, relatedVideos, onSelectVideo]);


  // Handle Favorites Toggle
  const handleToggleFav = useCallback(() => {
    if (!currentVideo) return;
    const nextFav = !localFav;
    setLocalFav(nextFav);

    if (onToggleFavorite) {
      onToggleFavorite(currentVideo);
    } else {
      // Safe direct localStorage fallback
      try {
        const raw = localStorage.getItem("streamflix_favorites");
        const parsed: YouTubeVideoItem[] = raw ? JSON.parse(raw) : [];
        const updated = nextFav
          ? [currentVideo, ...parsed.filter((v) => v.id !== currentVideo.id)]
          : parsed.filter((v) => v.id !== currentVideo.id);
        localStorage.setItem("streamflix_favorites", JSON.stringify(updated));
        window.dispatchEvent(new Event("streamflix_favorites_updated"));
      } catch (e) {
        console.warn("Could not sync favorite to localStorage:", e);
      }
    }
  }, [currentVideo, localFav, onToggleFavorite]);

  // Handle Native Share with safe Clipboard fallback
  const handleShare = async () => {
    if (!currentVideo) return;
    const videoUrl = `https://www.youtube.com/watch?v=${currentVideo.id}`;
    const sharePayload = {
      title: currentVideo.title,
      text: `Watch "${currentVideo.title}" on StreamFlix`,
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

    // Safe fallback to clipboard
    try {
      await navigator.clipboard.writeText(videoUrl);
      setShareNotice("Link Copied!");
      setTimeout(() => setShareNotice(null), 2500);
    } catch {
      setShareNotice("Copy failed");
      setTimeout(() => setShareNotice(null), 2000);
    }
  };

  // Handle Direct Copy Link
  const handleCopyLink = async () => {
    if (!currentVideo) return;
    const videoUrl = `https://www.youtube.com/watch?v=${currentVideo.id}`;
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // Handle selecting a related recommendation
  const handleSelectRelatedVideo = (item: YouTubeVideoItem) => {
    // Immediately play the video in the existing player
    setCurrentVideo(item);
    if (onSelectVideo) {
      onSelectVideo(item);
    }
    // Smoothly scroll back to top of the modal
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!isOpen || !currentVideo) return null;

  // Format Publication Date
  const formattedDate = currentVideo.publishedAt
    ? new Date(currentVideo.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  // Channel initial avatar monogram
  const channelInitial = (currentVideo.channelTitle || "Y").trim().charAt(0).toUpperCase();

  // Smart tag extraction based on title
  const tags: string[] = [];
  const titleLower = currentVideo.title.toLowerCase();
  if (titleLower.includes("trailer")) tags.push("Official Trailer");
  else if (titleLower.includes("teaser")) tags.push("Teaser");
  else if (titleLower.includes("behind")) tags.push("Behind The Scenes");
  else if (titleLower.includes("review")) tags.push("Review");
  else if (titleLower.includes("music") || titleLower.includes("song")) tags.push("Music");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="youtube-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Clickable Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-label="Close dialog overlay"
      />

      {/* Modal Dialog Card (Scrollable container so content below player has full vertical space) */}
      <div
        ref={scrollContainerRef}
        className="relative w-full max-w-4xl lg:max-w-5xl bg-[#0c131a] rounded-t-2xl sm:rounded-2xl overflow-y-auto shadow-2xl border border-[#1b2b3a] text-white z-10 max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 ring-1 ring-white/10 no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Sticky Close Button */}
        <div className="sticky top-0 z-50 flex justify-end p-3 sm:p-4 pointer-events-none -mb-12 sm:-mb-14">
          <button
            onClick={onClose}
            className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/80 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/20 shadow-xl active:scale-90 hover:scale-105"
            aria-label="Close video player"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 1. PLAYER SECTION: StreamFlix YouTube Player with Auto-Error State & Fallback Actions */}
        <div className="sticky top-0 z-40 aspect-video w-full bg-black flex-shrink-0 overflow-hidden shadow-2xl border-b border-[#1b2b3a]">
          <YouTubePlayer
            video={currentVideo}
            onFindAnother={handleFindAnother}
            onUnavailable={(badId) => {
              setRelatedVideos((prev) => prev.filter((v) => v.id !== badId));
            }}
          />
        </div>


        {/* Content Body Below YouTube Player */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 pb-safe">
          {/* 2. VIDEO INFORMATION HEADER */}
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

              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded border border-teal-500/35 bg-teal-500/10 text-[10px] font-semibold text-teal-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Prominent Video Title */}
            <h1
              id="youtube-modal-title"
              className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-sm pt-1"
            >
              {currentVideo.title}
            </h1>

            {/* Channel and Date Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                {/* Channel Avatar Monogram */}
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 text-white font-black text-sm sm:text-base flex items-center justify-center shadow-lg ring-2 ring-white/10 flex-shrink-0"
                  aria-hidden="true"
                >
                  {channelInitial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm sm:text-base text-zinc-100 truncate max-w-[220px] sm:max-w-md">
                      {currentVideo.channelTitle}
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
                  {formattedDate && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Published {formattedDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 pb-1 border-t border-[#1b2b3a]/90">
            {/* Favorites Action Button */}
            <button
              onClick={handleToggleFav}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 border active:scale-95 shadow-sm ${
                localFav
                  ? "bg-red-600/20 text-red-400 border-red-500/50 hover:bg-red-600/30 shadow-red-500/10"
                  : "bg-[#141f2d] hover:bg-[#1a283a] text-zinc-200 hover:text-white border-[#223548] hover:border-zinc-500"
              }`}
              aria-label={localFav ? "Remove from Favorites" : "Add to Favorites"}
            >
              <svg
                className={`w-4 h-4 transition-transform ${
                  localFav ? "fill-red-500 text-red-500 scale-110" : "fill-none text-current"
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
              <span>{localFav ? "Favorited" : "Favorites"}</span>
            </button>

            {/* Native Share / Copy fallback Button */}
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

            {/* Direct Copy Link Button */}
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
              href={`https://www.youtube.com/watch?v=${currentVideo.id}`}
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
              {formattedDate && (
                <span className="text-zinc-500 font-medium">Premiered {formattedDate}</span>
              )}
            </div>

            {currentVideo.description ? (
              <div>
                <p
                  className={`text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line ${
                    !showFullDesc ? "line-clamp-3" : ""
                  }`}
                >
                  {currentVideo.description}
                </p>
                {currentVideo.description.length > 180 && (
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

            {/* Official YouTube Embed Notice */}
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

          {/* 5. REDESIGNED MORE LIKE THIS RECOMMENDATIONS SECTION */}
          <section
            className="mt-8 pt-7 border-t-2 border-[#182635] space-y-5"
            aria-labelledby="more-like-this-heading"
          >
            {/* Prominent Header & Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 pb-1">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-teal-400 to-[#E50914] rounded-full" />
                  <h2
                    id="more-like-this-heading"
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

            {/* Error Message */}
            {relatedError && !loadingRelated && (
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400">
                <p>Could not load more recommendations: {relatedError}</p>
              </div>
            )}

            {/* Related Videos Grid */}
            {!loadingRelated && relatedVideos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
                {relatedVideos.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectRelatedVideo(item)}
                    className="group relative bg-[#0f1722] hover:bg-[#152334] border border-[#1b2b3a] hover:border-teal-400/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 flex flex-col active:scale-98"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectRelatedVideo(item);
                      }
                    }}
                    aria-label={`Play ${item.title}`}
                  >
                    {/* 16:9 Thumbnail Image */}
                    <div className="relative aspect-video w-full bg-black overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 filter brightness-95 group-hover:brightness-105"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />

                      {/* Prominent Play Overlay Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="w-11 h-11 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-2xl shadow-red-600/60 transform scale-75 group-hover:scale-100 transition-transform duration-300 pl-0.5">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>

                      {/* YouTube Tag */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1 border border-zinc-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span>YouTube</span>
                      </div>

                      {/* Quality Pill */}
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

            {/* Empty State */}
            {!loadingRelated && relatedVideos.length === 0 && !relatedError && (
              <div className="text-center py-8 bg-[#101720] rounded-xl border border-[#1b2b3a] p-4">
                <p className="text-xs sm:text-sm text-zinc-400">
                  No additional related videos found for this title.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
