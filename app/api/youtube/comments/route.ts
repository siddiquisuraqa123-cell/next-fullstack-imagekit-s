import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  YouTubeCommentsApiResponse,
  PostCommentRequestBody,
} from "@/types/youtube";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          items: [],
          error: "YOUTUBE_API_KEY is not configured.",
        } satisfies YouTubeCommentsApiResponse,
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const videoId = (searchParams.get("videoId") || searchParams.get("id") || "").trim();
    const order = (searchParams.get("order") || "relevance").trim();
    const pageToken = (searchParams.get("pageToken") || "").trim();
    const maxResultsParam = parseInt(searchParams.get("maxResults") || "20", 10);
    const maxResults = Math.min(Math.max(isNaN(maxResultsParam) ? 20 : maxResultsParam, 1), 50);

    if (!videoId) {
      return NextResponse.json(
        {
          items: [],
          error: "Missing required parameter: videoId",
        } satisfies YouTubeCommentsApiResponse,
        { status: 400 }
      );
    }

    const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
    url.searchParams.set("part", "snippet,replies");
    url.searchParams.set("videoId", videoId);
    url.searchParams.set("order", order === "time" ? "time" : "relevance");
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
      const errorItem = data?.error?.errors?.[0];
      const errorReason = errorItem?.reason || "";
      const errorMessage = data?.error?.message || "Failed to fetch YouTube comments";

      // YouTube returns 403 with reason "commentsDisabled" when the creator turned off comments
      if (res.status === 403 && (errorReason === "commentsDisabled" || errorMessage.toLowerCase().includes("disabled comments"))) {
        return NextResponse.json({
          items: [],
          commentsDisabled: true,
          error: "Comments are turned off for this video.",
        } satisfies YouTubeCommentsApiResponse);
      }

      if (res.status === 404 || errorReason === "videoNotFound") {
        return NextResponse.json(
          {
            items: [],
            error: "Video not found.",
          } satisfies YouTubeCommentsApiResponse,
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          items: [],
          error: errorMessage,
        } satisfies YouTubeCommentsApiResponse,
        { status: res.status }
      );
    }

    return NextResponse.json({
      items: Array.isArray(data.items) ? data.items : [],
      nextPageToken: data.nextPageToken || undefined,
      totalResults: data.pageInfo?.totalResults,
      commentsDisabled: false,
    } satisfies YouTubeCommentsApiResponse);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error reading comments.";
    console.error("[YouTube Comments GET Error]", err);
    return NextResponse.json(
      {
        items: [],
        error: errorMsg,
      } satisfies YouTubeCommentsApiResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate session and Google OAuth token on server
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "default_development_secret_streamflix_super_secure_key",
    });

    if (!token || !token.googleAccessToken) {
      return NextResponse.json(
        {
          error: "AUTH_REQUIRED",
          message: "You must connect your Google account with YouTube permissions to post comments.",
        },
        { status: 401 }
      );
    }

    // 2. Validate Origin / Referer for CSRF prevention
    const origin = request.headers.get("origin") || request.headers.get("referer");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json({ error: "CSRF check failed: Origin mismatch." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid Origin header." }, { status: 403 });
      }
    }

    // 3. Validate request payload
    let body: PostCommentRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const videoId = (body.videoId || "").trim();
    const text = (body.text || "").trim();

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: "Invalid or missing video ID." }, { status: 400 });
    }

    if (!text || text.length === 0) {
      return NextResponse.json({ error: "Comment text cannot be empty." }, { status: 400 });
    }

    if (text.length > 10000) {
      return NextResponse.json({ error: "Comment text exceeds maximum length of 10,000 characters." }, { status: 400 });
    }

    // 4. Publish comment through official YouTube Data API v3 commentThreads.insert
    const insertUrl = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
    insertUrl.searchParams.set("part", "snippet");

    const ytResponse = await fetch(insertUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.googleAccessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: text,
            },
          },
        },
      }),
    });

    const ytData = await ytResponse.json();

    if (!ytResponse.ok) {
      console.error("[YouTube commentThreads.insert Error]", ytResponse.status, ytData);
      const message = ytData?.error?.message || "Failed to post comment to YouTube.";
      const reason = ytData?.error?.errors?.[0]?.reason || "";

      if (ytResponse.status === 401) {
        return NextResponse.json(
          {
            error: "TOKEN_EXPIRED",
            message: "Your Google session has expired. Please re-authorize to post comments.",
          },
          { status: 401 }
        );
      }

      if (ytResponse.status === 403 && reason === "commentsDisabled") {
        return NextResponse.json(
          {
            error: "COMMENTS_DISABLED",
            message: "Comments are disabled on this video.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: "YOUTUBE_API_ERROR",
          message,
        },
        { status: ytResponse.status }
      );
    }

    return NextResponse.json(ytData, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error posting comment.";
    console.error("[YouTube Comments POST Exception]", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

