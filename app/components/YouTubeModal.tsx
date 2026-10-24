"use client";

import React, { useEffect, useState } from "react";
import { YouTubeVideoItem } from "@/types/youtube";

interface YouTubeModalProps {
  video: YouTubeVideoItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function YouTubeModal({ video, isOpen, onClose }: YouTubeModalProps) {
  const [copied, setCopied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

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

  // Reset state when video changes
  const handleCopyLink = () => {
    if (!video) return;
    const url = `https://www.youtube.com/watch?v=${video.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!isOpen || !video) return null;

  const formattedDate = video.publishedAt
    ? new Date(video.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="youtube-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Clickable Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-label="Close dialog overlay" />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-4xl bg-[#0c131a] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl border border-[#1b2b3a] text-white z-10 max-h-[94vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/80 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors border border-zinc-700 shadow-xl active:scale-95"
          aria-label="Close video player"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 16:9 Official YouTube Embedded Player */}
        <div className="relative aspect-video w-full bg-black flex-shrink-0">
          <iframe
            key={video.id}
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Video Information & Actions Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 no-scrollbar">
          {/* Channel & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#E50914] text-[10px] font-black uppercase tracking-wider text-white">
                YouTube
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {video.channelTitle}
              </span>
              {formattedDate && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs text-zinc-500">{formattedDate}</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white transition-colors border border-zinc-700"
                title="Copy video link"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>{copied ? "Copied!" : "Share"}</span>
              </button>

              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 text-xs font-semibold transition-colors border border-red-500/30"
                title="If embedding is disabled by the owner, watch directly on YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>Watch on YouTube</span>
              </a>
            </div>
          </div>

          {/* Title */}
          <h2
            id="youtube-modal-title"
            className="text-lg sm:text-2xl font-black text-white leading-snug tracking-tight"
          >
            {video.title}
          </h2>

          {/* Embed Notice / Fallback helper */}
          <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
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
            <p>
              Playing via YouTube&apos;s official embedded player. If an external owner restricts playback for this video on third-party sites, click <strong className="text-zinc-200">&quot;Watch on YouTube&quot;</strong> above.
            </p>
          </div>

          {/* Description */}
          {video.description && (
            <div className="pt-2 border-t border-zinc-800/80">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Description
              </p>
              <p
                className={`text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line ${
                  !showFullDesc ? "line-clamp-3" : ""
                }`}
              >
                {video.description}
              </p>
              {video.description.length > 180 && (
                <button
                  onClick={() => setShowFullDesc((prev) => !prev)}
                  className="mt-1 text-xs font-bold text-red-500 hover:text-red-400 underline underline-offset-2"
                >
                  {showFullDesc ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
