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
  isEmbeddable?: boolean;
}

export interface YouTubeSearchApiResponse {
  videos: YouTubeVideoItem[];
  nextPageToken?: string;
  totalResults?: number;
  query: string;
  error?: string;
  isKeyMissing?: boolean;
  regionCode?: string;
}

// ==========================================
// YOUTUBE COMMENTS & REPLIES TYPES
// ==========================================

export interface YouTubeCommentAuthorChannelId {
  value: string;
}

export interface YouTubeCommentSnippet {
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelUrl?: string;
  authorChannelId?: YouTubeCommentAuthorChannelId;
  channelId?: string;
  videoId?: string;
  textDisplay: string;
  textOriginal: string;
  parentId?: string;
  canRate?: boolean;
  viewerRating?: "like" | "none" | "dislike";
  likeCount: number;
  publishedAt: string;
  updatedAt?: string;
}

export interface YouTubeCommentItem {
  kind?: string;
  etag?: string;
  id: string;
  snippet: YouTubeCommentSnippet;
}

export interface YouTubeCommentThreadSnippet {
  channelId?: string;
  videoId: string;
  topLevelComment: YouTubeCommentItem;
  canReply: boolean;
  totalReplyCount: number;
  isPublic: boolean;
}

export interface YouTubeCommentThreadItem {
  kind?: string;
  etag?: string;
  id: string;
  snippet: YouTubeCommentThreadSnippet;
  replies?: {
    comments: YouTubeCommentItem[];
  };
}

export interface YouTubeCommentsApiResponse {
  items: YouTubeCommentThreadItem[];
  nextPageToken?: string;
  totalResults?: number;
  commentsDisabled?: boolean;
  error?: string;
}

export interface YouTubeRepliesApiResponse {
  items: YouTubeCommentItem[];
  nextPageToken?: string;
  error?: string;
}

export interface PostCommentRequestBody {
  videoId: string;
  text: string;
}

export interface ReplyCommentRequestBody {
  parentId: string;
  text: string;
}
