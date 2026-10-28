import { NextRequest, NextResponse } from "next/server";
import { YouTubeSearchApiResponse, YouTubeVideoItem } from "@/types/youtube";

// Decode HTML entities commonly returned by YouTube API (e.g., &quot;, &#39;, &amp;)
function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return _;
      }
    });
}

const PREVIEW_VIDEOS: YouTubeVideoItem[] = [
  // Blockbuster Entertainment & Cinema
  {
    id: "TcMBFSGVi1c",
    title: "Marvel Studios' Avengers: Endgame - Official Trailer",
    description: "Part of the journey is the end. Marvel Studios' Avengers: Endgame in theaters.",
    thumbnailUrl: "https://img.youtube.com/vi/TcMBFSGVi1c/hqdefault.jpg",
    channelTitle: "Marvel Entertainment",
    publishedAt: "2019-04-26T00:00:00Z",
  },
  {
    id: "d9MyW72ELq0",
    title: "Avatar: The Way of Water | Official Trailer",
    description: "Set more than a decade after the events of the first film, Avatar: The Way of Water tells the story of the Sully family.",
    thumbnailUrl: "https://img.youtube.com/vi/d9MyW72ELq0/hqdefault.jpg",
    channelTitle: "Avatar",
    publishedAt: "2022-11-02T00:00:00Z",
  },
  {
    id: "Way9Dexny3w",
    title: "Dune: Part Two | Official Trailer 3",
    description: "Dune: Part Two explores the mythic journey of Paul Atreides as he unites with Chani and the Fremen.",
    thumbnailUrl: "https://img.youtube.com/vi/Way9Dexny3w/hqdefault.jpg",
    channelTitle: "Warner Bros. Pictures",
    publishedAt: "2023-12-12T00:00:00Z",
  },
  {
    id: "b9EkMc79ZSU",
    title: "Stranger Things 4 | Official Trailer | Netflix",
    description: "It's time. See you on the other side. Stranger Things 4 premieres exclusively on Netflix.",
    thumbnailUrl: "https://img.youtube.com/vi/b9EkMc79ZSU/hqdefault.jpg",
    channelTitle: "Netflix",
    publishedAt: "2022-04-12T00:00:00Z",
  },
  {
    id: "JfVOs4VSpmA",
    title: "SPIDER-MAN: NO WAY HOME - Official Trailer",
    description: "We started getting visitors from every universe. Watch the official trailer for Spider-Man: No Way Home.",
    thumbnailUrl: "https://img.youtube.com/vi/JfVOs4VSpmA/hqdefault.jpg",
    channelTitle: "Sony Pictures Entertainment",
    publishedAt: "2021-11-17T00:00:00Z",
  },
  {
    id: "qEVUtrk8_B4",
    title: "John Wick: Chapter 4 (2023 Movie) Official Final Trailer",
    description: "John Wick uncovers a path to defeating The High Table.",
    thumbnailUrl: "https://img.youtube.com/vi/qEVUtrk8_B4/hqdefault.jpg",
    channelTitle: "Lionsgate Movies",
    publishedAt: "2023-02-16T00:00:00Z",
  },
  {
    id: "uYPbbksJxIg",
    title: "Oppenheimer | Official Trailer",
    description: "Written and directed by Christopher Nolan, Oppenheimer is an IMAX epic thriller.",
    thumbnailUrl: "https://img.youtube.com/vi/uYPbbksJxIg/hqdefault.jpg",
    channelTitle: "Universal Pictures",
    publishedAt: "2023-05-08T00:00:00Z",
  },
  {
    id: "shW9i6k8cB0",
    title: "Spider-Man: Across the Spider-Verse - Official Trailer",
    description: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People.",
    thumbnailUrl: "https://img.youtube.com/vi/shW9i6k8cB0/hqdefault.jpg",
    channelTitle: "Sony Pictures Entertainment",
    publishedAt: "2023-04-04T00:00:00Z",
  },
  // Gaming
  {
    id: "QdBZY2fkU-0",
    title: "Grand Theft Auto VI Trailer 1",
    description: "Grand Theft Auto VI heads to the state of Leonida, home to the neon-soaked streets of Vice City and beyond.",
    thumbnailUrl: "https://img.youtube.com/vi/QdBZY2fkU-0/hqdefault.jpg",
    channelTitle: "Rockstar Games",
    publishedAt: "2023-12-04T00:00:00Z",
  },
  {
    id: "EE-4GvjKcfs",
    title: "ELDEN RING – Official Gameplay Reveal Trailer",
    description: "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring.",
    thumbnailUrl: "https://img.youtube.com/vi/EE-4GvjKcfs/hqdefault.jpg",
    channelTitle: "Bandai Namco Entertainment",
    publishedAt: "2021-06-10T00:00:00Z",
  },
  {
    id: "4NRXx6U8ABQ",
    title: "Black Myth: Wukong - Official Gameplay Trailer",
    description: "Experience the mythic journey of the Destined One in Black Myth: Wukong.",
    thumbnailUrl: "https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
    channelTitle: "Game Science",
    publishedAt: "2024-01-18T00:00:00Z",
  },
  // Technology
  {
    id: "Btf4mN37OsU",
    title: "Apple Vision Pro - Reveal Trailer",
    description: "The era of spatial computing is here. Apple Vision Pro seamlessly blends digital content with your physical space.",
    thumbnailUrl: "https://img.youtube.com/vi/Btf4mN37OsU/hqdefault.jpg",
    channelTitle: "Apple",
    publishedAt: "2023-06-05T00:00:00Z",
  },
  {
    id: "29ECwExc-_M",
    title: "SpaceX Starship Integrated Flight Test - Highlights",
    description: "Starship's integrated flight test lifting off from Starbase in Boca Chica, Texas.",
    thumbnailUrl: "https://img.youtube.com/vi/29ECwExc-_M/hqdefault.jpg",
    channelTitle: "SpaceX",
    publishedAt: "2023-04-20T00:00:00Z",
  },
  {
    id: "tF4DML7FIWk",
    title: "Atlas | Partners in Parkour - Boston Dynamics",
    description: "Parkour is the ideal sandbox for the Atlas team at Boston Dynamics to experiment with new behaviors.",
    thumbnailUrl: "https://img.youtube.com/vi/tF4DML7FIWk/hqdefault.jpg",
    channelTitle: "Boston Dynamics",
    publishedAt: "2021-08-17T00:00:00Z",
  },
  // Music & Concerts
  {
    id: "fJ9rUzIMcZQ",
    title: "Queen – Bohemian Rhapsody (Official Video Remastered)",
    description: "The official Bohemian Rhapsody music video. Remastered in HD.",
    thumbnailUrl: "https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    channelTitle: "Queen Official",
    publishedAt: "2008-08-01T00:00:00Z",
  },
  {
    id: "JGwWNGJdvx8",
    title: "Ed Sheeran - Shape of You (Official Music Video)",
    description: "The official music video for Ed Sheeran - Shape of You.",
    thumbnailUrl: "https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    channelTitle: "Ed Sheeran",
    publishedAt: "2017-01-30T00:00:00Z",
  },
  {
    id: "OPf0YbXqDm0",
    title: "Mark Ronson - Uptown Funk (Official Video) ft. Bruno Mars",
    description: "Official Video for Uptown Funk by Mark Ronson ft. Bruno Mars.",
    thumbnailUrl: "https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg",
    channelTitle: "MarkRonsonVEVO",
    publishedAt: "2014-11-19T00:00:00Z",
  },
];

interface YouTubeRawSnippet {
  title?: string;
  description?: string;
  channelTitle?: string;
  channelId?: string;
  publishedAt?: string;
  thumbnails?: {
    maxres?: { url: string };
    high?: { url: string };
    medium?: { url: string };
    default?: { url: string };
  };
}

interface YouTubeDetailItem {
  id: string;
  snippet?: YouTubeRawSnippet;
  contentDetails?: {
    duration?: string;
    regionRestriction?: {
      allowed?: string[];
      blocked?: string[];
    };
    contentRating?: {
      ytRating?: string;
    };
  };
  status?: {
    uploadStatus?: string;
    privacyStatus?: string;
    embeddable?: boolean;
  };
}

function extractThumbnailUrl(snippet?: YouTubeRawSnippet, videoId?: string): string {
  const thumbs = snippet?.thumbnails || {};
  return (
    thumbs.maxres?.url ||
    thumbs.high?.url ||
    thumbs.medium?.url ||
    thumbs.default?.url ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "")
  );
}

function isDetailPlayableInRegion(detail: YouTubeDetailItem, regionCode: string): boolean {
  // 1. Must explicitly have embeddable !== false
  if (detail.status?.embeddable === false) {
    return false;
  }

  // 2. Must be processed and public
  if (detail.status?.uploadStatus && detail.status.uploadStatus !== "processed") {
    return false;
  }
  if (detail.status?.privacyStatus && detail.status.privacyStatus !== "public") {
    return false;
  }

  // 3. Must not be age-restricted (YouTube blocks embedded playback for age-restricted videos)
  if (detail.contentDetails?.contentRating?.ytRating === "ytAgeRestricted") {
    return false;
  }

  // 4. Region restriction verification
  const rr = detail.contentDetails?.regionRestriction;
  if (rr) {
    const regUpper = regionCode.toUpperCase();
    if (Array.isArray(rr.blocked)) {
      const blockedList = rr.blocked.map((r) => r.toUpperCase());
      if (blockedList.includes(regUpper)) {
        return false;
      }
    }
    if (Array.isArray(rr.allowed) && rr.allowed.length > 0) {
      const allowedList = rr.allowed.map((r) => r.toUpperCase());
      if (!allowedList.includes(regUpper)) {
        return false;
      }
    }
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const searchParams = request.nextUrl.searchParams;
    const singleId = (searchParams.get("id") || searchParams.get("videoId") || "").trim();
    const query = (searchParams.get("q") || "").trim() || "trending movie trailers";
    const pageToken = (searchParams.get("pageToken") || "").trim();
    const regionCode = (searchParams.get("regionCode") || "IN").trim().toUpperCase();
    const relevanceLanguage = (searchParams.get("relevanceLanguage") || "en").trim();
    const excludeIdsParam = searchParams.get("excludeIds") || "";
    const excludeIds = new Set(
      excludeIdsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );

    const maxResultsParam = parseInt(searchParams.get("maxResults") || "18", 10);
    const maxResults = Math.min(Math.max(isNaN(maxResultsParam) ? 18 : maxResultsParam, 1), 25);

    // If API key is not configured, return preview trailers so the UI and embedded player work immediately
    if (!apiKey) {
      if (singleId) {
        const previewMatch = PREVIEW_VIDEOS.find((v) => v.id === singleId);
        return NextResponse.json({
          videos: previewMatch ? [previewMatch] : [],
          query: "",
          isKeyMissing: true,
          regionCode,
        } satisfies YouTubeSearchApiResponse);
      }

      const qLower = query.toLowerCase();
      let filtered = PREVIEW_VIDEOS.filter(
        (v) =>
          !excludeIds.has(v.id) &&
          (v.title.toLowerCase().includes(qLower) ||
            v.channelTitle.toLowerCase().includes(qLower) ||
            v.description.toLowerCase().includes(qLower))
      );

      // If category keyword matches Gaming, Tech, Music, etc.
      if (filtered.length === 0) {
        if (qLower.includes("gaming") || qLower.includes("game")) {
          filtered = PREVIEW_VIDEOS.filter((v) => ["QdBZY2fkU-0", "EE-4GvjKcfs", "4NRXx6U8ABQ"].includes(v.id));
        } else if (qLower.includes("tech") || qLower.includes("apple") || qLower.includes("space")) {
          filtered = PREVIEW_VIDEOS.filter((v) => ["Btf4mN37OsU", "29ECwExc-_M", "tF4DML7FIWk"].includes(v.id));
        } else if (qLower.includes("music") || qLower.includes("song") || qLower.includes("concert")) {
          filtered = PREVIEW_VIDEOS.filter((v) => ["fJ9rUzIMcZQ", "JGwWNGJdvx8", "OPf0YbXqDm0"].includes(v.id));
        }
      }

      const safeFallback = (filtered.length > 0 ? filtered : PREVIEW_VIDEOS).filter((v) => !excludeIds.has(v.id));

      return NextResponse.json({
        error:
          "YouTube API key is not configured in .env.local or Vercel. Showing preview trailers so you can test the embedded player right now. Set YOUTUBE_API_KEY to enable live searches.",
        isKeyMissing: true,
        videos: safeFallback.slice(0, maxResults),
        query,
        regionCode,
      } satisfies YouTubeSearchApiResponse);
    }

    // Direct Single Video Lookup by ID (used for deep-linking ?v=id and direct verification)
    if (singleId) {
      const singleUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      singleUrl.searchParams.set("part", "snippet,contentDetails,status");
      singleUrl.searchParams.set("id", singleId);
      singleUrl.searchParams.set("key", apiKey);

      const singleRes = await fetch(singleUrl.toString(), {
        next: { revalidate: 120 },
        headers: { Accept: "application/json" },
      });

      const singleData = await singleRes.json();
      if (!singleRes.ok) {
        return NextResponse.json(
          {
            error: singleData?.error?.message || "Failed to fetch video details.",
            videos: [],
            query: "",
            regionCode,
          } satisfies YouTubeSearchApiResponse,
          { status: singleRes.status }
        );
      }

      const item: YouTubeDetailItem | undefined = singleData.items?.[0];
      if (!item) {
        return NextResponse.json({
          videos: [],
          query: "",
          regionCode,
        } satisfies YouTubeSearchApiResponse);
      }

      const isPlayable = isDetailPlayableInRegion(item, regionCode);
      const snippet = item.snippet;
      const videoItem: YouTubeVideoItem = {
        id: item.id,
        title: decodeHtmlEntities(snippet?.title || "YouTube Video"),
        description: decodeHtmlEntities(snippet?.description || ""),
        thumbnailUrl: extractThumbnailUrl(snippet, item.id),
        channelTitle: decodeHtmlEntities(snippet?.channelTitle || "YouTube Creator"),
        channelId: snippet?.channelId,
        publishedAt: snippet?.publishedAt || new Date().toISOString(),
        isEmbeddable: isPlayable,
      };

      return NextResponse.json({
        videos: [videoItem],
        query: "",
        regionCode,
      } satisfies YouTubeSearchApiResponse);
    }

    // YouTube Data API v3 search endpoint with strict embeddable & syndicated filters
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("videoEmbeddable", "true");
    searchUrl.searchParams.set("videoSyndicated", "true");
    searchUrl.searchParams.set("regionCode", regionCode);
    if (relevanceLanguage) {
      searchUrl.searchParams.set("relevanceLanguage", relevanceLanguage);
    }
    // Fetch a buffer of items so that after filtering out region/metadata restrictions, maxResults is met
    const fetchLimit = Math.min(maxResults + 10, 50);
    searchUrl.searchParams.set("maxResults", String(fetchLimit));
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("key", apiKey);

    if (pageToken) {
      searchUrl.searchParams.set("pageToken", pageToken);
    }

    const ytResponse = await fetch(searchUrl.toString(), {
      // Revalidate search results for 60 seconds
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
      },
    });

    const data = await ytResponse.json();

    if (!ytResponse.ok) {
      const errReason = data?.error?.errors?.[0]?.reason || "";
      const errMessage = data?.error?.message || "YouTube API error occurred.";

      let friendlyMessage = errMessage;
      if (errReason === "quotaExceeded") {
        friendlyMessage =
          "YouTube Data API daily quota limit exceeded. Please try again later or check your Google Cloud Console quota.";
      } else if (errReason === "keyInvalid" || ytResponse.status === 400) {
        friendlyMessage =
          "Invalid YouTube API key. Please check your YOUTUBE_API_KEY in your .env.local or Vercel project settings.";
      }

      console.error("[YouTube API Error]", data?.error || data);
      return NextResponse.json(
        {
          error: friendlyMessage,
          videos: [],
          query,
          regionCode,
        } satisfies YouTubeSearchApiResponse,
        { status: ytResponse.status }
      );
    }

    const rawItems = Array.isArray(data.items) ? data.items : [];
    const candidateItems = rawItems.filter(
      (item: { id?: { videoId?: string } }) =>
        Boolean(item?.id?.videoId) && !excludeIds.has(item.id!.videoId!)
    );

    const candidateIds = candidateItems
      .map((item: { id: { videoId: string } }) => item.id.videoId)
      .filter(Boolean);

    // Validate video metadata, status, embeddability, and region restriction using videos.list batch call
    // Note: videos.list costs only 1 quota unit for the entire batch of up to 50 video IDs.
    const validIdSet = new Set<string>();

    if (candidateIds.length > 0) {
      try {
        const validateUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
        validateUrl.searchParams.set("part", "contentDetails,status");
        validateUrl.searchParams.set("id", candidateIds.join(","));
        validateUrl.searchParams.set("key", apiKey);

        const validateRes = await fetch(validateUrl.toString(), {
          next: { revalidate: 180 },
          headers: { Accept: "application/json" },
        });

        if (validateRes.ok) {
          const validateData = await validateRes.json();
          const detailItems: YouTubeDetailItem[] = Array.isArray(validateData.items)
            ? validateData.items
            : [];

          for (const detail of detailItems) {
            if (detail?.id && isDetailPlayableInRegion(detail, regionCode)) {
              validIdSet.add(detail.id);
            }
          }
        } else {
          // If videos.list validation fails unexpectedly, keep candidate IDs as a graceful fallback
          candidateIds.forEach((id: string) => validIdSet.add(id));
        }
      } catch (valErr) {
        console.warn("[YouTube videos.list Error] Falling back to search candidates:", valErr);
        candidateIds.forEach((id: string) => validIdSet.add(id));
      }
    }

    // Filter search results to only validated playable videos
    const videos: YouTubeVideoItem[] = candidateItems
      .filter((item: { id: { videoId: string } }) => validIdSet.has(item.id.videoId))
      .map((item: {
        id: { videoId: string };
        snippet: YouTubeRawSnippet;
      }) => {
        const snippet = item.snippet || {};
        return {
          id: item.id.videoId,
          title: decodeHtmlEntities(snippet.title || "Untitled Video"),
          description: decodeHtmlEntities(snippet.description || ""),
          thumbnailUrl: extractThumbnailUrl(snippet, item.id.videoId),
          channelTitle: decodeHtmlEntities(snippet.channelTitle || "YouTube Creator"),
          channelId: snippet.channelId,
          publishedAt: snippet.publishedAt || new Date().toISOString(),
          isEmbeddable: true,
        };
      });

    return NextResponse.json({
      videos: videos.slice(0, maxResults),
      nextPageToken: data.nextPageToken || undefined,
      totalResults: data.pageInfo?.totalResults,
      query,
      regionCode,
    } satisfies YouTubeSearchApiResponse);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal server error fetching YouTube videos.";
    console.error("[YouTube Route Error]", err);
    return NextResponse.json(
      {
        error: errorMsg,
        videos: [],
        query: "",
      } satisfies YouTubeSearchApiResponse,
      { status: 500 }
    );
  }
}

