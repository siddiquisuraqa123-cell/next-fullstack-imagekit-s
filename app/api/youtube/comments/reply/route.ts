import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ReplyCommentRequestBody } from "@/types/youtube";

export async function POST(request: NextRequest) {
  try {
    // 1. Validate session and Google OAuth token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "default_development_secret_streamflix_super_secure_key",
    });

    if (!token || !token.googleAccessToken) {
      return NextResponse.json(
        {
          error: "AUTH_REQUIRED",
          message: "You must connect your Google account with YouTube permissions to reply to comments.",
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
    let body: ReplyCommentRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const parentId = (body.parentId || "").trim();
    const text = (body.text || "").trim();

    if (!parentId) {
      return NextResponse.json({ error: "Missing required field: parentId" }, { status: 400 });
    }

    if (!text || text.length === 0) {
      return NextResponse.json({ error: "Reply text cannot be empty." }, { status: 400 });
    }

    if (text.length > 10000) {
      return NextResponse.json({ error: "Reply text exceeds maximum length of 10,000 characters." }, { status: 400 });
    }

    // 4. Publish reply through official YouTube Data API v3 comments.insert
    const replyUrl = new URL("https://www.googleapis.com/youtube/v3/comments");
    replyUrl.searchParams.set("part", "snippet");

    const ytResponse = await fetch(replyUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.googleAccessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        snippet: {
          parentId,
          textOriginal: text,
        },
      }),
    });

    const ytData = await ytResponse.json();

    if (!ytResponse.ok) {
      console.error("[YouTube comments.insert Error]", ytResponse.status, ytData);
      const message = ytData?.error?.message || "Failed to post reply to YouTube.";

      if (ytResponse.status === 401) {
        return NextResponse.json(
          {
            error: "TOKEN_EXPIRED",
            message: "Your Google session has expired. Please re-authorize to post replies.",
          },
          { status: 401 }
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
    const errorMsg = err instanceof Error ? err.message : "Internal server error posting reply.";
    console.error("[YouTube Comments Reply POST Exception]", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

