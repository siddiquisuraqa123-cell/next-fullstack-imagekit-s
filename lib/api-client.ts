import { IVideo } from "@/model/video";
import { YouTubeSearchApiResponse } from "@/types/youtube";

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
      throw new Error(await response.text());
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
}


export const apiClient = new ApiClient();