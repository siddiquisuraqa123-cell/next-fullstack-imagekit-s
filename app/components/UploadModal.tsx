"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import FileUpload from "./FileUpload";
import { apiClient } from "@/lib/api-client";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: UploadModalProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !videoUrl || !thumbnailUrl) {
      setErrorMessage("Please fill in all fields (upload video and thumbnail or paste URLs).");
      return;
    }

    if (!session) {
      setErrorMessage("You must be logged in to publish a video. Please sign in or create an account.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.createVideo({
        title,
        description,
        videoUrl,
        thumbnailUrl,
        controls: true,
        transformation: {
          width: 1920,
          height: 1080,
          quality: 95,
        },
      });

      // Reset
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setThumbnailUrl("");
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      console.error("Publishing error:", err);
      let msg = err.message || "Failed to upload video to catalogue.";
      if (msg.includes("ECONNREFUSED") || msg.includes("Failed to create video")) {
        msg = "Database connection error. Please ensure your MongoDB instance or MongoDB Atlas URI is running and set in MONGODB_URI in .env.local.";
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-lg bg-[#181818] border border-zinc-800 rounded-t-2xl sm:rounded-xl p-5 sm:p-8 text-white shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto z-10 pb-safe animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Indicator */}
        <div className="sm:hidden w-12 h-1 bg-zinc-700 rounded-full mx-auto -mt-2 mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="bg-[#E50914] text-white px-2 py-0.5 rounded text-[11px] font-black">
              STREAMFLIX
            </span>
            <h2 className="text-lg sm:text-xl font-bold">Add to Catalogue</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-full transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Not Logged In Warning */}
        {!session && (
          <div className="p-3 bg-amber-950/60 border border-amber-700/70 rounded-lg text-amber-200 text-xs flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <span>You are not signed in. </span>
              <Link href="/login" onClick={onClose} className="font-bold underline text-amber-100 hover:text-white">
                Sign In
              </Link>
              <span> or </span>
              <Link href="/register" onClick={onClose} className="font-bold underline text-amber-100 hover:text-white">
                Register
              </Link>
              <span> to save videos to the database.</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-950/70 border border-red-700/80 rounded text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          {/* Title */}
          <div className="space-y-1">
            <label className="block text-zinc-300 font-semibold">Video Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stranger Signals: Episode 1"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-[#E50914] focus:outline-none text-white text-base sm:text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-zinc-300 font-semibold">Synopsis</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the film or episode..."
              required
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-[#E50914] focus:outline-none text-white text-base sm:text-sm resize-none"
            />
          </div>

          {/* Video Upload via ImageKit or Direct URL */}
          <div className="space-y-1.5">
            <label className="block text-zinc-300 font-semibold">
              Video File (Upload to ImageKit)
            </label>
            <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-2">
              <FileUpload
                fileType="video"
                onSuccess={(res) => {
                  if (res?.url) {
                    setVideoUrl(res.url);
                  }
                }}
              />
              <div className="pt-1">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Or paste direct video URL (https://...)"
                  className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Thumbnail Upload via ImageKit or Direct URL */}
          <div className="space-y-1.5">
            <label className="block text-zinc-300 font-semibold">
              Thumbnail Poster (Upload to ImageKit)
            </label>
            <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-2">
              <FileUpload
                fileType="image"
                onSuccess={(res) => {
                  if (res?.url) {
                    setThumbnailUrl(res.url);
                  }
                }}
              />
              <div className="pt-1">
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Or paste poster image URL (https://...)"
                  className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors text-center"
            >
              {isSubmitting ? "Saving..." : "Publish to StreamFlix"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
