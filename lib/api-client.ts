import { IVideo } from "@/model/video";
import {
  YouTubeSearchApiResponse,
  YouTubeCommentsApiResponse,
  YouTubeRepliesApiResponse,
  YouTubeCommentThreadItem,
  YouTubeCommentItem,
} from "@/types/youtube";

export type VideoFormData = Omit<IVideo, "_id">;

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
};

class ApiClient {
  private async fetch<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    const response = await fetch(`/api${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errBody: string;
      try {
        errBody = await response.text();
      } catch {
        errBody = response.statusText;
      }
      throw new Error(errBody);
    }

    return (await response.json()) as T;
  }

  async getVideos() {
    return this.fetch<IVideo[]>("/video");
  }

  async createVideo(videoData: VideoFormData) {
    return this.fetch<IVideo>("/video", {
      method: "POST",
      body: videoData,
    });
  }

  async searchYouTube(
    query: string,
    pageToken?: string,
    maxResults?: number,
    excludeIds?: string[]
  ) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (pageToken) params.set("pageToken", pageToken);
    if (maxResults) params.set("maxResults", String(maxResults));
    if (excludeIds && excludeIds.length > 0) {
      params.set("excludeIds", excludeIds.join(","));
    }
    const queryString = params.toString();
    return this.fetch<YouTubeSearchApiResponse>(
      `/youtube${queryString ? `?${queryString}` : ""}`
    );
  }

  async getVideoById(id: string) {
    const params = new URLSearchParams({ id });
    return this.fetch<YouTubeSearchApiResponse>(`/youtube?${params.toString()}`);
  }

  // ==========================================
  // YOUTUBE COMMENTS & REPLIES
  // ==========================================

  async getYouTubeComments(
    videoId: string,
    order: "relevance" | "time" = "relevance",
    pageToken?: string,
    maxResults?: number
  ) {
    const params = new URLSearchParams({ videoId, order });
    if (pageToken) params.set("pageToken", pageToken);
    if (maxResults) params.set("maxResults", String(maxResults));
    return this.fetch<YouTubeCommentsApiResponse>(
      `/youtube/comments?${params.toString()}`
    );
  }

  async getYouTubeCommentReplies(
    parentId: string,
    pageToken?: string,
    maxResults?: number
  ) {
    const params = new URLSearchParams({ parentId });
    if (pageToken) params.set("pageToken", pageToken);
    if (maxResults) params.set("maxResults", String(maxResults));
    return this.fetch<YouTubeRepliesApiResponse>(
      `/youtube/comments/replies?${params.toString()}`
    );
  }

  async postYouTubeComment(videoId: string, text: string) {
    return this.fetch<YouTubeCommentThreadItem>("/youtube/comments", {
      method: "POST",
      body: { videoId, text },
    });
  }

  async replyToYouTubeComment(parentId: string, text: string) {
    return this.fetch<YouTubeCommentItem>("/youtube/comments/reply", {
      method: "POST",
      body: { parentId, text },
    });
  }
}

export const apiClient = new ApiClient();
