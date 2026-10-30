"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { YouTubeVideoItem } from "@/types/youtube";
import { markVideoUnavailable, isUnavailable } from "@/lib/unavailable-videos";

export interface YouTubePlayerRef {
  playVideo: () => void;
  pauseVideo: () => void;
  replayVideo: () => void;
  loadVideoById: (videoId: string) => void;
  getPlayerState: () => number;
  getPlayer: () => unknown;
}

export interface YouTubePlayerProps {
  video: YouTubeVideoItem;
  className?: string;
  isSticky?: boolean;
  onFindAnother?: () => void;
  onUnavailable?: (videoId: string) => void;
  autoPlay?: boolean;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onEnded?: () => void;
  autoplayNext?: boolean;
  playerRef?: React.MutableRefObject<YouTubePlayerRef | null>;
  onPlayerReady?: (player: YouTubePlayerRef) => void;
  onStateChange?: (state: number) => void;
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
            onReady?: (event: { target: unknown }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
          playerVars?: Record<string, unknown>;
        }
      ) => {
        destroy?: () => void;
        playVideo?: () => void;
        pauseVideo?: () => void;
        getPlayerState?: () => number;
        seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
        loadVideoById?: (options: string | { videoId: string; startSeconds?: number }) => void;
        cueVideoById?: (options: string | { videoId: string; startSeconds?: number }) => void;
      };
      PlayerState?: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
      ready?: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Shared API loader state and callback queue across all player instances
let isYTApiScriptLoading = false;
const readyCallbacks: (() => void)[] = [];

function flushReadyCallbacks() {
  while (readyCallbacks.length > 0) {
    const cb = readyCallbacks.shift();
    if (cb) {
      try {
        cb();
      } catch (err) {
        console.warn("[StreamFlix Player] Callback execution note:", err);
      }
    }
  }
}

function ensureYouTubeIframeApi(callback: () => void) {
  if (typeof window === "undefined") return;

  // 1. If YouTube API is already loaded and ready
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }

  // 2. Queue callback
  readyCallbacks.push(callback);

  // 3. If window.YT.ready is already provided by YouTube
  if (window.YT && typeof window.YT.ready === "function") {
    window.YT.ready(() => {
      flushReadyCallbacks();
    });
    return;
  }

  // 4. Register or chain with window.onYouTubeIframeAPIReady
  const prevReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof prevReady === "function") {
      try {
        prevReady();
      } catch (e) {
        console.warn("[StreamFlix Player] Previous onYouTubeIframeAPIReady error:", e);
      }
    }
    flushReadyCallbacks();
  };

  // 5. Fallback polling in case the script finishes without triggering the handler
  const pollInterval = setInterval(() => {
    if (window.YT && window.YT.Player) {
      clearInterval(pollInterval);
      flushReadyCallbacks();
    }
  }, 100);
  setTimeout(() => clearInterval(pollInterval), 5000);

  // 6. Inject the YouTube IFrame API script tag once
  if (!isYTApiScriptLoading) {
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existing) {
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
    } else {
      isYTApiScriptLoading = true;
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
  hasPrevious = false,
  hasNext = true,
  onPrevious,
  onNext,
  onEnded,
  autoplayNext = true,
  playerRef,
  onPlayerReady,
  onStateChange,
}: YouTubePlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  // Track player state: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
  const [playerState, setPlayerState] = useState<number>(autoPlay ? 1 : 2);
  const lastEndedVideoIdRef = useRef<string | null>(null);
  const hasStartedPlaybackRef = useRef(false);

  const cleanVideoId = (video?.id || "").trim();
  const cleanVideoIdRef = useRef(cleanVideoId);
  cleanVideoIdRef.current = cleanVideoId;

  // Track the video ID loaded inside the active iframe player
  const currentlyLoadedVideoIdRef = useRef<string>(cleanVideoId);

  // Keep stable refs for callbacks to prevent stale closures inside YT events
  const autoplayNextRef = useRef(autoplayNext);
  autoplayNextRef.current = autoplayNext;

  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerInstanceRef = useRef<any>(null);
  const isPlayerReadyRef = useRef(false);

  // Control overlay visibility: visible on hover / touch, auto-hides after inactivity while playing
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    // Auto-hide only when video is actively playing
    if (playerState === 1) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 2600);
    }
  }, [playerState]);

  const triggerError = useCallback(
    (code?: number) => {
      const vId = cleanVideoIdRef.current;
      if (!vId) return;
      console.warn(`[StreamFlix Player] Any error received from YouTube: ${code} for video: ${vId}`);
      setHasError(true);
      if (code) setErrorCode(code);
      markVideoUnavailable(vId);
      if (onUnavailable) {
        onUnavailable(vId);
      }
    },
    [onUnavailable]
  );

  // Handler for YouTube player state changes from both IFrame API & postMessage
  const handleStateChange = useCallback((newState: number) => {
    console.log(`[StreamFlix Player] Player state changes: ${newState}`);
    setPlayerState(newState);

    if (onStateChangeRef.current) {
      onStateChangeRef.current(newState);
    }

    // Handle video finished (0 = YT.PlayerState.ENDED)
    if (newState === 0) {
      const vId = cleanVideoIdRef.current;
      console.log(`[StreamFlix Player] Video ENDED event received.`);
      console.log(`[StreamFlix Player] Autoplay preference: ${autoplayNextRef.current ? "ON" : "OFF"}`);

      // Completion guard: ensure only ONE trigger per video ID
      if (lastEndedVideoIdRef.current === vId) {
        console.log(`[StreamFlix Player] ENDED event already processed for ${vId}, skipping duplicate.`);
        return;
      }
      lastEndedVideoIdRef.current = vId;
      hasStartedPlaybackRef.current = false;

      if (autoplayNextRef.current) {
        if (onEndedRef.current) {
          onEndedRef.current();
        }
      }
    } else if (newState === 1) {
      // Actively playing
      hasStartedPlaybackRef.current = true;
    }
  }, []);

  // Keep controls visible when paused, buffering, or ended; fade after inactivity when playing
  useEffect(() => {
    if (playerState === 2 || playerState === 0 || playerState === -1) {
      setControlsVisible(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    } else if (playerState === 1) {
      resetHideTimer();
    }
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [playerState, resetHideTimer]);

  // Method 1: Listen to window HTML5 postMessage from YouTube iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate event origin is from YouTube or same origin (for parent page communication / tests)
      const isAllowedOrigin =
        typeof event.origin === "string" &&
        (event.origin.includes("youtube.com") ||
          event.origin.includes("youtube-nocookie.com") ||
          (typeof window !== "undefined" && event.origin === window.location.origin) ||
          event.origin === "");

      if (!isAllowedOrigin) {
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

      // Listen for player state changes from postMessage
      if (data.event === "onStateChange" && typeof data.info === "number") {
        handleStateChange(data.info);
      } else if (data.event === "infoDelivery" && typeof data.info?.playerState === "number") {
        handleStateChange(data.info.playerState);
      }

      // Catch embed error codes:
      let detectedCode: number | null = null;
      if (data.event === "onError" && (typeof data.info === "number" || typeof data.info === "string")) {
        detectedCode = Number(data.info);
      } else if (data.event === "infoDelivery" && data.info?.errorCode) {
        detectedCode = Number(data.info.errorCode);
      }

      if (detectedCode !== null && [2, 5, 100, 101, 150].includes(detectedCode)) {
        triggerError(detectedCode);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleStateChange, triggerError]);

  // Method 2: Attach official YT.Player ONCE on mount
  useEffect(() => {
    if (hasError) return;

    let isSubscribed = true;
    ensureYouTubeIframeApi(() => {
      if (!isSubscribed || !iframeRef.current) return;
      if (!document.contains(iframeRef.current)) return;

      try {
        if (window.YT && window.YT.Player) {
          playerInstanceRef.current = new window.YT.Player(iframeRef.current, {
            events: {
              onReady: () => {
                if (!isSubscribed) return;
                isPlayerReadyRef.current = true;
                console.log("[StreamFlix Player] YouTube player ready.");
              },
              onStateChange: (event) => {
                if (isSubscribed && typeof event.data === "number") {
                  handleStateChange(event.data);
                }
              },
              onError: (event) => {
                if (isSubscribed && typeof event.data === "number") {
                  console.log(`[StreamFlix Player] Any error received from YouTube: ${event.data}`);
                  triggerError(event.data);
                }
              },
            },
          });
        }
      } catch (err) {
        console.warn("[StreamFlix Player] YT.Player hook note:", err);
      }
    });

    return () => {
      isSubscribed = false;
      playerInstanceRef.current = null;
      isPlayerReadyRef.current = false;
    };
  }, [hasError, handleStateChange, triggerError]);

  // Playback control operations
  const pauseVideo = useCallback(() => {
    console.log("[StreamFlix Player] Player play command executed: pauseVideo()");
    const player = playerInstanceRef.current;
    if (player && typeof player.pauseVideo === "function") {
      try {
        player.pauseVideo();
      } catch {}
    }
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
      "*"
    );
    setPlayerState(2);
  }, []);

  const playVideo = useCallback(() => {
    console.log("[StreamFlix Player] Player play command executed: playVideo()");
    const player = playerInstanceRef.current;
    if (player && typeof player.playVideo === "function") {
      try {
        player.playVideo();
      } catch {}
    }
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "playVideo", args: [] }),
      "*"
    );
    setPlayerState(1);
  }, []);

  const replayVideo = useCallback(() => {
    console.log("[StreamFlix Player] Player play command executed: replayVideo() (seekTo(0) + playVideo())");
    const player = playerInstanceRef.current;
    if (player && typeof player.seekTo === "function" && typeof player.playVideo === "function") {
      try {
        player.seekTo(0, true);
        player.playVideo();
      } catch {}
    }
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "seekTo", args: [0, true] }),
      "*"
    );
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "playVideo", args: [] }),
      "*"
    );
    setPlayerState(1);
    lastEndedVideoIdRef.current = null;
  }, []);

  const loadVideoById = useCallback((videoId: string) => {
    console.log(`[StreamFlix Player] Player play command executed: loadVideoById(${videoId})`);
    const player = playerInstanceRef.current;
    if (player && typeof player.loadVideoById === "function") {
      try {
        player.loadVideoById({ videoId });
      } catch {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "loadVideoById", args: [videoId] }),
          "*"
        );
      }
    } else {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "loadVideoById", args: [videoId] }),
        "*"
      );
    }
    setPlayerState(1);
    lastEndedVideoIdRef.current = null;
  }, []);

  // Expose player handle to parent component via playerRef and onPlayerReady
  useEffect(() => {
    const handle: YouTubePlayerRef = {
      playVideo,
      pauseVideo,
      replayVideo,
      loadVideoById,
      getPlayerState: () => {
        const player = playerInstanceRef.current;
        if (player && typeof player.getPlayerState === "function") {
          try {
            return player.getPlayerState();
          } catch {}
        }
        return playerState;
      },
      getPlayer: () => playerInstanceRef.current,
    };

    if (playerRef) {
      playerRef.current = handle;
    }
    if (onPlayerReady && isPlayerReadyRef.current) {
      onPlayerReady(handle);
    }
  }, [playVideo, pauseVideo, replayVideo, loadVideoById, playerState, playerRef, onPlayerReady]);

  // When cleanVideoId prop changes, load the new video on the EXISTING player instance!
  useEffect(() => {
    if (!cleanVideoId) return;

    if (isUnavailable(cleanVideoId)) {
      setHasError(true);
      setErrorCode(150);
      return;
    }
    setHasError(false);
    setErrorCode(null);

    // If cleanVideoId is different from the currently loaded video, switch seamlessly!
    if (currentlyLoadedVideoIdRef.current !== cleanVideoId) {
      console.log(
        `[StreamFlix Player] Video ID changed from ${currentlyLoadedVideoIdRef.current} to ${cleanVideoId}. Switching via existing player instance.`
      );
      currentlyLoadedVideoIdRef.current = cleanVideoId;
      hasStartedPlaybackRef.current = false;
      setPlayerState(autoPlay ? 1 : 2);
      setControlsVisible(true);

      const player = playerInstanceRef.current;
      if (player && typeof player.loadVideoById === "function") {
        console.log(`[StreamFlix Player] Player play command executed: loadVideoById(${cleanVideoId})`);
        try {
          player.loadVideoById({ videoId: cleanVideoId });
        } catch {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "loadVideoById", args: [cleanVideoId] }),
            "*"
          );
        }
      } else {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "loadVideoById", args: [cleanVideoId] }),
          "*"
        );

        // Fallback before player is ready
        if (!isPlayerReadyRef.current && iframeRef.current) {
          const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : "";
          const newSrc = `https://www.youtube-nocookie.com/embed/${cleanVideoId}?autoplay=${
            autoPlay ? 1 : 0
          }&enablejsapi=1&rel=0&modestbranding=1&playsinline=1${originParam}`;
          if (iframeRef.current.src !== newSrc) {
            iframeRef.current.src = newSrc;
          }
        }
      }
    }
  }, [cleanVideoId, autoPlay, origin]);

  const currentOrigin = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const originParam = currentOrigin ? `&origin=${encodeURIComponent(currentOrigin)}` : "";
  const iframeSrc = `https://www.youtube-nocookie.com/embed/${cleanVideoId}?autoplay=${
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
            {video?.title || "YouTube Video"}
          </div>

          {/* Action Buttons: Watch on YouTube & Find Another Video */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 w-full">
            {/* 1. Watch on YouTube Button */}
            <a
              href={`https://www.youtube.com/watch?v=${cleanVideoId}`}
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
      className={`relative aspect-video w-full bg-black overflow-hidden group/ytplayer select-none ${className}`}
      onMouseMove={resetHideTimer}
      onMouseEnter={resetHideTimer}
      onMouseLeave={() => {
        if (playerState === 1) {
          setControlsVisible(false);
        }
      }}
      onTouchStart={resetHideTimer}
    >
      {/* Existing Persistent IFrame without dynamic key to prevent unmounting */}
      <iframe
        ref={iframeRef}
        id="streamflix-yt-iframe"
        src={iframeSrc}
        title={video?.title || "YouTube video player"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full border-0 pointer-events-auto"
        referrerPolicy="strict-origin-when-cross-origin"
        suppressHydrationWarning
      />

      {/* ========================================================================= */}
      {/* CENTER PLAYBACK CONTROLS (Horizontally and Vertically Centered Over Video) */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-300 ease-in-out ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Player Controls Overlay"
      >
        <div
          className={`flex items-center justify-center gap-3 sm:gap-5 md:gap-7 pointer-events-auto transition-transform duration-200 ${
            isSticky ? "scale-75 sm:scale-90" : "scale-100"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Previous Video Button (Skip-back icon) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (hasPrevious && onPrevious) {
                onPrevious();
              }
            }}
            disabled={!hasPrevious}
            aria-disabled={!hasPrevious}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/40 ${
              hasPrevious
                ? "bg-black/65 hover:bg-black/90 text-white hover:text-red-400 border border-white/20 hover:border-red-500/50 hover:scale-110 active:scale-95 cursor-pointer shadow-black/80"
                : "bg-black/40 text-white/30 border border-white/10 cursor-not-allowed opacity-35 shadow-none"
            }`}
            title={hasPrevious ? "Previous Video" : "No previous video"}
            aria-label="Previous Video"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* 2. Large Central Pause / Play / Replay Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (playerState === 0) {
                replayVideo();
              } else if (playerState === 1 || playerState === 3) {
                pauseVideo();
              } else {
                playVideo();
              }
            }}
            className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-[#E50914]/90 hover:bg-[#E50914] text-white flex items-center justify-center shadow-2xl shadow-red-600/50 border border-white/25 ring-4 ring-black/40 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-red-500/60"
            title={
              playerState === 0
                ? "Replay Video"
                : playerState === 1 || playerState === 3
                ? "Pause Video"
                : "Play / Continue Video"
            }
            aria-label={
              playerState === 0
                ? "Replay Video"
                : playerState === 1 || playerState === 3
                ? "Pause Video"
                : "Play / Continue Video"
            }
          >
            {playerState === 0 ? (
              // Replay Icon
              <svg
                className="w-7 h-7 sm:w-9 sm:h-9 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ) : playerState === 1 || playerState === 3 ? (
              // Pause Icon (||)
              <svg className="w-6 h-6 sm:w-8 sm:h-8 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              // Play Icon (▶)
              <svg className="w-7 h-7 sm:w-9 sm:h-9 fill-current translate-x-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* 3. Next Video Button (Skip-forward icon) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (hasNext && onNext) {
                onNext();
              }
            }}
            disabled={!hasNext}
            aria-disabled={!hasNext}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/40 ${
              hasNext
                ? "bg-black/65 hover:bg-black/90 text-white hover:text-red-400 border border-white/20 hover:border-red-500/50 hover:scale-110 active:scale-95 cursor-pointer shadow-black/80"
                : "bg-black/40 text-white/30 border border-white/10 cursor-not-allowed opacity-35 shadow-none"
            }`}
            title={hasNext ? "Next Video" : "No next video"}
            aria-label="Next Video"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>

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
