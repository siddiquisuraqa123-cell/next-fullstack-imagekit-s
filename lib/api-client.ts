import { IVideo } from "@/model/video";

export type VideoFormData = Omit<IVideo, "_id">;

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any
  headers?: Record<string, string>
}

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
}

export const apiClient = new ApiClient()