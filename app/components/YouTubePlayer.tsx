"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { YouTubeVideoItem } from "@/types/youtube";
import { markVideoUnavailable, isUnavailable } from "@/lib/unavailable-videos";

export interface YouTubePlayerProps {
  video: YouTubeVideoItem;
  className?: string;
  isSticky?: boolean;
  onFindAnother?: () => void;
  onUnavailable?: (videoId: string) => void;
  autoPlay?: boolean;
}

// Global declaration for YouTube Iframe API
declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          events?: {
            onError?: (event: { data: number }) => void;
            onReady?: (event: unknown) => void;
            onStateChange?: (event: { data: number }) => void;
          };
          playerVars?: Record<string, unknown>;
        }
      ) => {
        destroy?: () => void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let isYTApiScriptLoading = false;
function ensureYouTubeIframeApi(callback: () => void) {
  if (typeof window === "undefined") return;
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }

  // Chain callback onto existing or new ready handler
  const prevReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (prevReady) prevReady();
    callback();
  };

  if (!isYTApiScriptLoading) {
    isYTApiScriptLoading = true;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName("script")[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }
  }
}

export default function YouTubePlayer({
  video,
  className = "",
  isSticky = false,
  onFindAnother,
  onUnavailable,
  autoPlay = true,
}: YouTubePlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [origin, setOrigin] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerInstanceRef = useRef<{ destroy?: () => void } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const triggerError = useCallback(
    (code?: number) => {
      setHasError(true);
      if (code) setErrorCode(code);
      markVideoUnavailable(video.id);
      if (onUnavailable) {
        onUnavailable(video.id);
      }
    },
    [video.id, onUnavailable]
  );

  // Synchronize error state when video changes
  useEffect(() => {
    if (isUnavailable(video.id)) {
      setHasError(true);
      setErrorCode(150);
      return;
    }
    setHasError(false);
    setErrorCode(null);
  }, [video.id]);

  // Method 1: Listen to window HTML5 postMessage from YouTube iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate event origin is from YouTube
      if (
        typeof event.origin === "string" &&
        !event.origin.includes("youtube.com") &&
        !event.origin.includes("youtube-nocookie.com")
      ) {
        return;
      }

      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data || typeof data !== "object") return;

      // YouTube error codes:
      // 2: Invalid parameter
      // 5: HTML5 player error
      // 100: Video not found, removed, or marked private
      // 101: Owner disabled playback in embedded players
      // 150: Same as 101 (Content ID / region / embed restriction)
      const isErrorEvent =
        data.event === "onError" ||
        (data.event === "infoDelivery" && data.info?.errorCode) ||
        data.info === 101 ||
        data.info === 150 ||
        data.info === 100 ||
        data.info === 2 ||
        data.info === 5;

      if (isErrorEvent) {
        const code = Number(data.info?.errorCode || data.info || 150);
        triggerError(code);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [triggerError]);

  // Method 2: Hook with official YT.Player Iframe API for typed onError callback
  useEffect(() => {
    if (hasError) return;

    let isSubscribed = true;
    ensureYouTubeIframeApi(() => {
      if (!isSubscribed || !iframeRef.current) return;
      try {
        if (playerInstanceRef.current?.destroy) {
          playerInstanceRef.current.destroy();
          playerInstanceRef.current = null;
        }

        if (window.YT && window.YT.Player) {
          playerInstanceRef.current = new window.YT.Player(iframeRef.current, {
            events: {
              onError: (event) => {
                if (isSubscribed) {
                  triggerError(event.data);
                }
              },
            },
          });
        }
      } catch (err) {
        console.warn("[YouTubePlayer] YT.Player hook note:", err);
      }
    });

    return () => {
      isSubscribed = false;
      if (playerInstanceRef.current?.destroy) {
        try {
          playerInstanceRef.current.destroy();
        } catch {
          // ignore
        }
        playerInstanceRef.current = null;
      }
    };
  }, [video.id, hasError, triggerError]);

  const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : "";
  const iframeSrc = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=${
    autoPlay ? 1 : 0
  }&enablejsapi=1&rel=0&modestbranding=1&playsinline=1${originParam}`;

  // If the video is restricted or unavailable, show the clean StreamFlix error screen
  if (hasError) {
    return (
      <div
        className={`relative aspect-video w-full bg-gradient-to-br from-[#121b26] via-[#0b1017] to-[#070b10] border border-red-500/30 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none ${className}`}
        role="alert"
        aria-label="Video playback unavailable"
      >
        {/* Ambient Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md w-full space-y-3.5 flex flex-col items-center">
          {/* Badge Icon */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 flex items-center justify-center shadow-lg shadow-red-900/30">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Embedded Playback Unavailable
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {errorCode === 101 || errorCode === 150
                ? "The video owner or platform policy restricts playback in embedded players outside YouTube."
                : "This video cannot be played inside the embedded player due to copyright or regional restrictions."}
            </p>
          </div>

          {/* Video Title preview */}
          <div className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] sm:text-xs text-zinc-300 truncate">
            {video.title}
          </div>

          {/* Action Buttons: Watch on YouTube & Find Another Video */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 w-full">
            {/* 1. Watch on YouTube Button */}
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-red-600/25 active:scale-95"
              aria-label="Watch video directly on YouTube in new tab"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span>Watch on YouTube</span>
              <svg
                className="w-3.5 h-3.5 stroke-current opacity-80"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>

            {/* 2. Find Another Video Action */}
            {onFindAnother && (
              <button
                type="button"
                onClick={onFindAnother}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 hover:text-teal-200 border border-teal-500/40 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-sm"
                aria-label="Find another matching video"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Find Another Video</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-video w-full bg-black overflow-hidden group/ytplayer ${className}`}
    >
      <iframe
        ref={iframeRef}
        key={video.id}
        id={`yt-player-${video.id}`}
        src={iframeSrc}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full border-0"
      />

      {/* Subtle overlay trigger for users if playback hangs or shows third-party error */}
      {!isSticky && (
        <div className="absolute top-2 right-2 opacity-0 group-hover/ytplayer:opacity-100 transition-opacity duration-200 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => triggerError(150)}
            className="px-2 py-1 rounded bg-black/80 hover:bg-zinc-800 text-[10px] font-medium text-zinc-300 hover:text-white border border-zinc-700/80 backdrop-blur-md flex items-center gap-1 shadow-lg"
            title="If video shows 'Video unavailable' or won't play, click to view StreamFlix options"
          >
            <svg
              className="w-3 h-3 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Playback issue?</span>
          </button>
        </div>
      )}
    </div>
  );
}
