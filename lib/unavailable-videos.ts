"use client";

import { YouTubeVideoItem } from "@/types/youtube";

const STORAGE_KEY = "streamflix_unavailable_videos_v2";

// In-memory set for high-performance synchronous lookups
const inMemoryUnavailableIds = new Set<string>();
let isInitialized = false;

function initFromStorage() {
  if (isInitialized || typeof window === "undefined") return;
  try {
    // Clear legacy corrupted cache from old false-positive bug
    sessionStorage.removeItem("streamflix_unavailable_videos");

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => inMemoryUnavailableIds.add(id));
      }
    }
  } catch (err) {
    console.warn("[UnavailableVideos] Could not read from sessionStorage:", err);
  }
  isInitialized = true;
}

export function getUnavailableVideoIds(): Set<string> {
  initFromStorage();
  return new Set(inMemoryUnavailableIds);
}

export function isUnavailable(videoId: string): boolean {
  if (!videoId) return false;
  initFromStorage();
  return inMemoryUnavailableIds.has(videoId);
}

export function markVideoUnavailable(videoId: string): void {
  if (!videoId) return;
  initFromStorage();

  if (!inMemoryUnavailableIds.has(videoId)) {
    inMemoryUnavailableIds.add(videoId);

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(Array.from(inMemoryUnavailableIds))
        );
      } catch (err) {
        console.warn("[UnavailableVideos] Could not save to sessionStorage:", err);
      }

      // Notify other components to prune this video from recommendations/carousels
      window.dispatchEvent(
        new CustomEvent("streamflix_unavailable_video", {
          detail: { videoId },
        })
      );
      window.dispatchEvent(new Event("streamflix_unavailable_videos_updated"));
    }
  }
}

export function filterAvailableVideos<T extends { id: string }>(videos: T[]): T[] {
  if (!Array.isArray(videos)) return [];
  initFromStorage();
  return videos.filter((v) => v && v.id && !inMemoryUnavailableIds.has(v.id));
}

export function pickReplacementVideo(
  currentId: string,
  candidates: YouTubeVideoItem[]
): YouTubeVideoItem | null {
  initFromStorage();
  for (const item of candidates) {
    if (item && item.id && item.id !== currentId && !inMemoryUnavailableIds.has(item.id)) {
      return item;
    }
  }
  return null;
}

export function clearUnavailableVideos(): void {
  inMemoryUnavailableIds.clear();
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("streamflix_unavailable_videos_updated"));
    } catch {
      // ignore
    }
  }
}
