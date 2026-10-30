"use client";

import { YouTubeVideoItem } from "@/types/youtube";

const STORAGE_KEY = "streamflix_session_played_videos_v1";

// Synchronous in-memory set for zero-overhead lookups
const inMemoryPlayedIds = new Set<string>();
let isInitialized = false;

function initFromStorage(): void {
  if (isInitialized || typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => {
          if (id && typeof id === "string") inMemoryPlayedIds.add(id);
        });
      }
    }
  } catch (err) {
    console.warn("[PlaybackHistory] Could not read from sessionStorage:", err);
  }
  isInitialized = true;
}

/**
 * Returns a copy of all video IDs played during the current browser session.
 */
export function getPlayedVideoIds(): Set<string> {
  initFromStorage();
  return new Set(inMemoryPlayedIds);
}

/**
 * Check if a video ID has already been played in this session.
 */
export function isPlayedVideo(videoId: string): boolean {
  if (!videoId) return false;
  initFromStorage();
  return inMemoryPlayedIds.has(videoId);
}

/**
 * Record a video ID as played in the current session.
 */
export function addPlayedVideoId(videoId: string): void {
  if (!videoId) return;
  initFromStorage();

  if (!inMemoryPlayedIds.has(videoId)) {
    inMemoryPlayedIds.add(videoId);

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(Array.from(inMemoryPlayedIds))
        );
      } catch (err) {
        console.warn("[PlaybackHistory] Could not save to sessionStorage:", err);
      }

      window.dispatchEvent(
        new CustomEvent("streamflix_played_video_added", {
          detail: { videoId },
        })
      );
      window.dispatchEvent(new Event("streamflix_played_videos_updated"));
    }
  }
}

/**
 * Filter an array of items, returning only items that have not yet been played
 * in this session and are not marked unavailable.
 */
export function filterUnplayedVideos<T extends { id: string }>(
  items: T[],
  currentVideoId?: string
): T[] {
  if (!Array.isArray(items)) return [];
  initFromStorage();
  const seenIds = new Set<string>();

  return items.filter((item) => {
    if (!item || !item.id) return false;
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);

    if (currentVideoId && item.id === currentVideoId) return false;
    if (inMemoryPlayedIds.has(item.id)) return false;

    return true;
  });
}

/**
 * Clear the session played history (e.g. when the user explicitly requests to restart/refresh queue).
 */
export function clearPlayedVideoHistory(): void {
  inMemoryPlayedIds.clear();
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("streamflix_played_videos_updated"));
    } catch {
      // ignore
    }
  }
}

