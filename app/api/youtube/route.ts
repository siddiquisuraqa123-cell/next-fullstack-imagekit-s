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
    id: "Vb9nBcxQh_g",
    title: "Introducing Apple Vision Pro - Spatial Computing",
    description: "The era of spatial computing is here. Apple Vision Pro seamlessly blends digital content with your physical space.",
    thumbnailUrl: "https://img.youtube.com/vi/Vb9nBcxQh_g/hqdefault.jpg",
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
    id: "fn3K35Ut64o",
    title: "Atlas | Boston Dynamics - The Next Generation",
    description: "A new fully electric Atlas humanoid robot designed for real-world applications.",
    thumbnailUrl: "https://img.youtube.com/vi/fn3K35Ut64o/hqdefault.jpg",
    channelTitle: "Boston Dynamics",
    publishedAt: "2024-04-17T00:00:00Z",
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

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("q") || "").trim() || "trending movie trailers";
    const pageToken = (searchParams.get("pageToken") || "").trim();
    const maxResultsParam = parseInt(searchParams.get("maxResults") || "18", 10);
    const maxResults = Math.min(Math.max(isNaN(maxResultsParam) ? 18 : maxResultsParam, 1), 25);

    // If API key is not configured, return preview trailers so the UI and embedded player work immediately
    if (!apiKey) {
      const qLower = query.toLowerCase();
      let filtered = PREVIEW_VIDEOS.filter(
        (v) =>
          v.title.toLowerCase().includes(qLower) ||
          v.channelTitle.toLowerCase().includes(qLower) ||
          v.description.toLowerCase().includes(qLower)
      );

      // If category keyword matches Gaming, Tech, Music, etc.
      if (filtered.length === 0) {
        if (qLower.includes("gaming") || qLower.includes("game")) {
          filtered = PREVIEW_VIDEOS.filter((v) => ["QdBZY2fkU-0", "EE-4GvjKcfs", "4NRXx6U8ABQ"].includes(v.id));
        } else if (qLower.includes("tech") || qLower.includes("apple") || qLower.includes("space")) {
          filtered = PREVIEW_VIDEOS.filter((v) => ["Vb9nBcxQh_g", "29ECwExc-_M", "fn3K35Ut64o"].includes(v.id));
        } else if (qLower.includes("music") || qLower.includes("song") || qLower.includes("concert")) {
          filtered = PREVIEW_VIDEOS.filter((v) => ["fJ9rUzIMcZQ", "JGwWNGJdvx8", "OPf0YbXqDm0"].includes(v.id));
        }
      }

      return NextResponse.json({
        error:
          "YouTube API key is not configured in .env.local or Vercel. Showing preview trailers so you can test the embedded player right now. Set YOUTUBE_API_KEY to enable live searches.",
        isKeyMissing: true,
        videos: (filtered.length > 0 ? filtered : PREVIEW_VIDEOS).slice(0, maxResults),
        query,
      } satisfies YouTubeSearchApiResponse);
    }

    // YouTube Data API v3 search endpoint
    // videoEmbeddable=true ensures returned videos can be played via official YouTube iframe player
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("videoEmbeddable", "true");
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("q", query);
    url.searchParams.set("key", apiKey);

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const ytResponse = await fetch(url.toString(), {
      // Revalidate cache for 60 seconds to optimize performance while staying fresh
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
        } satisfies YouTubeSearchApiResponse,
        { status: ytResponse.status }
      );
    }

    // Map YouTube search results into a clean, safe format (never leaking any sensitive data)
    const items = Array.isArray(data.items) ? data.items : [];
    const videos: YouTubeVideoItem[] = items
      .filter((item: { id?: { videoId?: string } }) => Boolean(item?.id?.videoId))
      .map((item: {
        id: { videoId: string };
        snippet: {
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
        };
      }) => {
        const snippet = item.snippet || {};
        const thumbs = snippet.thumbnails || {};
        const thumbnailUrl =
          thumbs.maxres?.url ||
          thumbs.high?.url ||
          thumbs.medium?.url ||
          thumbs.default?.url ||
          `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`;

        return {
          id: item.id.videoId,
          title: decodeHtmlEntities(snippet.title || "Untitled Video"),
          description: decodeHtmlEntities(snippet.description || ""),
          thumbnailUrl,
          channelTitle: decodeHtmlEntities(snippet.channelTitle || "YouTube Creator"),
          channelId: snippet.channelId,
          publishedAt: snippet.publishedAt || new Date().toISOString(),
        };
      });

    return NextResponse.json({
      videos,
      nextPageToken: data.nextPageToken || undefined,
      totalResults: data.pageInfo?.totalResults,
      query,
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
