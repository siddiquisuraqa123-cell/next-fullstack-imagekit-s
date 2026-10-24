export interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YouTubeVideoItem {
  id: string; // YouTube Video ID
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId?: string;
  publishedAt: string;
}

export interface YouTubeSearchApiResponse {
  videos: YouTubeVideoItem[];
  nextPageToken?: string;
  totalResults?: number;
  query: string;
  error?: string;
  isKeyMissing?: boolean;
}
