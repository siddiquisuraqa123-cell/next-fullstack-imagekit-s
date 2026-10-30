import { NextRequest, NextResponse } from "next/server";
import { YouTubeRepliesApiResponse } from "@/types/youtube";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { items: [], error: "YOUTUBE_API_KEY is not configured." } satisfies YouTubeRepliesApiResponse,
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const parentId = (searchParams.get("parentId") || "").trim();
    const pageToken = (searchParams.get("pageToken") || "").trim();
    const maxResultsParam = parseInt(searchParams.get("maxResults") || "20", 10);
    const maxResults = Math.min(Math.max(isNaN(maxResultsParam) ? 20 : maxResultsParam, 1), 100);

    if (!parentId) {
      return NextResponse.json(
        { items: [], error: "Missing required parameter: parentId" } satisfies YouTubeRepliesApiResponse,
        { status: 400 }
      );
    }

    const url = new URL("https://www.googleapis.com/youtube/v3/comments");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("parentId", parentId);
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("key", apiKey);

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const res = await fetch(url.toString(), {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          items: [],
          error: data?.error?.message || "Failed to fetch comment replies",
        } satisfies YouTubeRepliesApiResponse,
        { status: res.status }
      );
    }

    return NextResponse.json({
      items: Array.isArray(data.items) ? data.items : [],
      nextPageToken: data.nextPageToken || undefined,
    } satisfies YouTubeRepliesApiResponse);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error reading replies.";
    console.error("[YouTube Replies GET Error]", err);
    return NextResponse.json(
      { items: [], error: errorMsg } satisfies YouTubeRepliesApiResponse,
      { status: 500 }
    );
  }
}

