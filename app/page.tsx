"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Navbar from "./components/Navbar";
import HeroBanner, { FeaturedMovie } from "./components/HeroBanner";
import MovieRow from "./components/MovieRow";
import VideoModal from "./components/VideoModal";
import UploadModal from "./components/UploadModal";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import { apiClient } from "@/lib/api-client";
import { IVideo } from "@/model/video";
import {
  CURATED_MOVIES,
  CURATED_SERIES,
  ALL_CURATED_MEDIA,
} from "@/lib/catalog-data";

export default function Home() {
  const [dbVideos, setDbVideos] = useState<FeaturedMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<FeaturedMovie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Home");
  const [subGenre, setSubGenre] = useState("All");
  const [mobileTab, setMobileTab] = useState("home");

  const trendingRef = useRef<HTMLDivElement>(null);

  // Fetch videos from user's backend database
  const loadVideos = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getVideos();
      if (Array.isArray(res) && res.length > 0) {
        const formatted: FeaturedMovie[] = res.map((item: IVideo, index: number) => ({
          id: item._id ? item._id.toString() : `db-${index}`,
          title: item.title,
          description: item.description,
          videoUrl: item.videoUrl,
          thumbnailUrl: item.thumbnailUrl,
          matchScore: 98 - (index % 5),
          rating: "16+",
          duration: "1h 45m",
          tags: ["User Upload", "ImageKit Stream", "Exclusive"],
          isOriginal: true,
          type: "movie",
          genre: "User Upload",
          releaseYear: "2026",
        }));
        setDbVideos(formatted);
      }
    } catch (err) {
      console.warn("Could not fetch DB videos, using curated catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Reset subGenre when switching main categories
  useEffect(() => {
    setSubGenre("All");
  }, [activeCategory]);

  // Combine database videos with curated catalog for global search
  const allMedia = useMemo(() => {
    return [...dbVideos, ...ALL_CURATED_MEDIA];
  }, [dbVideos]);

  // Filtered list when search query is active
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allMedia.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.genre?.toLowerCase().includes(q) ||
        m.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [allMedia, searchQuery]);

  // Dynamic Featured Billboard Movie based on current page/category
  const heroMovie = useMemo(() => {
    if (activeCategory === "TV Shows") {
      if (subGenre !== "All") {
        const match = CURATED_SERIES.find((s) =>
          s.genre?.toLowerCase() === subGenre.toLowerCase() ||
          s.tags?.some((t) => t.toLowerCase().includes(subGenre.toLowerCase()))
        );
        if (match) return match;
      }
      return CURATED_SERIES[0];
    }

    if (activeCategory === "Movies") {
      if (subGenre !== "All") {
        const match = CURATED_MOVIES.find((m) =>
          m.genre?.toLowerCase() === subGenre.toLowerCase() ||
          m.tags?.some((t) => t.toLowerCase().includes(subGenre.toLowerCase()))
        );
        if (match) return match;
      }
      return CURATED_MOVIES[0];
    }

    if (activeCategory === "New & Popular") {
      return CURATED_MOVIES[1];
    }

    // Default Home: user's upload or flagship blockbuster
    return dbVideos[0] || CURATED_MOVIES[0];
  }, [activeCategory, subGenre, dbVideos]);

  // Filtered movies by subgenre
  const filteredMovies = useMemo(() => {
    if (subGenre === "All") return CURATED_MOVIES;
    return CURATED_MOVIES.filter(
      (m) =>
        m.genre?.toLowerCase() === subGenre.toLowerCase() ||
        m.tags?.some((t) => t.toLowerCase().includes(subGenre.toLowerCase()))
    );
  }, [subGenre]);

  // Filtered series by subgenre
  const filteredSeries = useMemo(() => {
    if (subGenre === "All") return CURATED_SERIES;
    return CURATED_SERIES.filter(
      (s) =>
        s.genre?.toLowerCase() === subGenre.toLowerCase() ||
        s.tags?.some((t) => t.toLowerCase().includes(subGenre.toLowerCase()))
    );
  }, [subGenre]);

  // Handlers
  const handlePlay = (movie: FeaturedMovie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleSelect = (movie: FeaturedMovie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const scrollToTrending = () => {
    setMobileTab("trending");
    if (trendingRef.current) {
      trendingRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleHomeClick = () => {
    setMobileTab("home");
    setActiveCategory("Home");
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-[#141414] text-white selection:bg-[#E50914] selection:text-white pb-20 md:pb-0">
      {/* Navbar with brand, search, upload and profile dropdown */}
      <Navbar
        onSearch={(q) => setSearchQuery(q)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        activeCategory={activeCategory}
      />

      {/* When user is actively searching: Show Netflix Grid Results */}
      {searchQuery.trim() ? (
        <main className="pt-24 sm:pt-28 px-3 sm:px-6 md:px-12 min-h-[70vh]">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-zinc-300">
            Search results for:{" "}
            <span className="text-white font-extrabold italic">
              &quot;{searchQuery}&quot;
            </span>{" "}
            <span className="text-xs sm:text-sm text-zinc-500 font-normal">
              ({searchResults.length} {searchResults.length === 1 ? "title" : "titles"})
            </span>
          </h2>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
              {searchResults.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => handleSelect(movie)}
                  className="group relative aspect-video bg-zinc-900 rounded-md overflow-hidden cursor-pointer active:scale-95 md:hover:scale-105 transition-all duration-300 shadow-lg border border-zinc-800"
                >
                  <img
                    src={movie.thumbnailUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover filter brightness-90 md:group-hover:brightness-105"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow ${
                      movie.type === "series" ? "bg-amber-500 text-black" : "bg-black/70 text-zinc-200 border border-zinc-700"
                    }`}>
                      {movie.type === "series" ? "SERIES" : "MOVIE"}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-2 sm:p-3 flex flex-col justify-end">
                    <h3 className="font-bold text-[11px] sm:text-sm text-white truncate">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-zinc-300 mt-0.5">
                      <span className="text-emerald-400 font-bold">
                        {movie.matchScore}% Match
                      </span>
                      <span>{movie.type === "series" && movie.seasons ? movie.seasons : movie.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-2.5">
              <p className="text-zinc-400 text-sm sm:text-base">
                Your search for &quot;{searchQuery}&quot; did not match any movies or TV shows.
              </p>
              <p className="text-xs text-zinc-500">
                Suggestions: Try searching by genre (&quot;Sci-Fi&quot;, &quot;Action&quot;), title (&quot;Cosmos&quot;, &quot;Protocol&quot;), or check your spelling.
              </p>
            </div>
          )}
        </main>
      ) : (
        /* Normal Layout */
        <main className="relative pb-8 sm:pb-16">
          {/* Hero Featured Billboard Banner */}
          <HeroBanner
            movie={heroMovie}
            onPlay={handlePlay}
            onMoreInfo={handleSelect}
          />

          {/* PAGE VIEW: MOVIES */}
          {activeCategory === "Movies" && (
            <div className="relative -mt-12 sm:-mt-24 md:-mt-36 z-30 space-y-4 sm:space-y-6 md:space-y-8">
              {/* Category Title & Genre Pills Sub-header */}
              <div className="px-3 sm:px-6 md:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Movies</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Feature Films
                    </span>
                  </h1>
                </div>

                {/* Genre Filter Pills */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
                  {["All", "Action", "Sci-Fi", "Crime", "Fantasy", "Thriller"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSubGenre(g)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                        subGenre === g
                          ? "bg-white text-black font-bold shadow-lg scale-105"
                          : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {g === "All" ? "All Movies" : g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distinct Movie Rows */}
              <div ref={trendingRef}>
                <MovieRow
                  title="🔥 Trending Movies Today"
                  movies={filteredMovies.slice(0, 6)}
                  onPlay={handlePlay}
                  onSelect={handleSelect}
                />
              </div>

              <MovieRow
                title="🎬 Hollywood & International Blockbusters"
                movies={CURATED_MOVIES.slice(2, 8)}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              <MovieRow
                title="💥 High-Octane Action & Thrillers"
                movies={CURATED_MOVIES.filter(
                  (m) => m.genre === "Action" || m.tags?.includes("Action")
                )}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              <MovieRow
                title="🌌 Mind-Bending Sci-Fi & Cosmic Epics"
                movies={CURATED_MOVIES.filter(
                  (m) => m.genre === "Sci-Fi" || m.tags?.includes("Sci-Fi")
                )}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              <MovieRow
                title="🏆 Critically Acclaimed Feature Films"
                movies={[...CURATED_MOVIES].reverse().slice(0, 7)}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />
            </div>
          )}

          {/* PAGE VIEW: TV SHOWS (WEB SERIES) */}
          {activeCategory === "TV Shows" && (
            <div className="relative -mt-12 sm:-mt-24 md:-mt-36 z-30 space-y-4 sm:space-y-6 md:space-y-8">
              {/* Category Title & Genre Pills Sub-header */}
              <div className="px-3 sm:px-6 md:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>TV Shows & Web Series</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      Binge-Worthy
                    </span>
                  </h1>
                </div>

                {/* Genre Filter Pills */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
                  {["All", "Sci-Fi", "Mystery", "Crime", "Drama", "Horror"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSubGenre(g)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                        subGenre === g
                          ? "bg-amber-500 text-black font-bold shadow-lg scale-105"
                          : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {g === "All" ? "All Series" : g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distinct Web Series Rows */}
              <div ref={trendingRef}>
                <MovieRow
                  title="📺 Top 10 Web Series Today"
                  movies={filteredSeries.slice(0, 6)}
                  onPlay={handlePlay}
                  onSelect={handleSelect}
                />
              </div>

              <MovieRow
                title="☕ Binge-Worthy Crime & Mystery Shows"
                movies={CURATED_SERIES.filter(
                  (s) => s.genre === "Crime" || s.genre === "Mystery"
                )}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              <MovieRow
                title="🤖 Futuristic Sci-Fi & Cyber Anthologies"
                movies={CURATED_SERIES.filter((s) => s.genre === "Sci-Fi")}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              <MovieRow
                title="👑 Imperial Court & Dynasty Dramas"
                movies={CURATED_SERIES.filter((s) => s.genre === "Drama")}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              <MovieRow
                title="⚡ Chilling Thrillers & Mini-Series"
                movies={CURATED_SERIES.filter(
                  (s) =>
                    s.seasons?.includes("Limited") ||
                    s.tags?.includes("Chilling") ||
                    s.tags?.includes("Gothic")
                )}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />
            </div>
          )}

          {/* PAGE VIEW: NEW & POPULAR */}
          {activeCategory === "New & Popular" && (
            <div className="relative -mt-12 sm:-mt-24 md:-mt-36 z-30 space-y-4 sm:space-y-6 md:space-y-8">
              <div className="px-3 sm:px-6 md:px-12 pt-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                  New & Popular
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Fresh 2026 releases, trending seasons, and most-watched titles.
                </p>
              </div>

              <MovieRow
                title="🆕 Brand New 2026 Movie Releases"
                movies={CURATED_MOVIES.filter((m) => m.releaseYear === "2026")}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              <MovieRow
                title="✨ New Web Series Seasons"
                movies={CURATED_SERIES.filter((s) => s.releaseYear === "2026")}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              <MovieRow
                title="🔥 Top 10 Trending Globally"
                movies={ALL_CURATED_MEDIA.slice(0, 8)}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />
            </div>
          )}

          {/* PAGE VIEW: MY LIST */}
          {activeCategory === "My List" && (
            <div className="relative -mt-12 sm:-mt-24 md:-mt-36 z-30 space-y-4 sm:space-y-6 md:space-y-8">
              <div className="px-3 sm:px-6 md:px-12 pt-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                  My List & Your Uploads
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Videos and titles saved to your catalog.
                </p>
              </div>

              {dbVideos.length > 0 ? (
                <MovieRow
                  title="✨ Your Uploaded Catalog"
                  movies={dbVideos}
                  onPlay={handlePlay}
                  onSelect={handleSelect}
                />
              ) : (
                <div className="px-3 sm:px-6 md:px-12 py-8 bg-zinc-900/60 rounded-lg mx-3 sm:mx-6 md:mx-12 border border-zinc-800 text-center space-y-3">
                  <p className="text-zinc-300 text-sm sm:text-base">
                    You haven&apos;t uploaded any videos yet.
                  </p>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="bg-[#E50914] hover:bg-[#c11119] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded shadow transition-colors"
                  >
                    Upload Video to Catalog
                  </button>
                </div>
              )}

              <MovieRow
                title="⭐ Recommended For You"
                movies={CURATED_MOVIES.slice(0, 6)}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />
            </div>
          )}

          {/* PAGE VIEW: HOME (DEFAULT MIXED EXPERIENCE) */}
          {(activeCategory === "Home" || activeCategory === "Browse by Languages") && (
            <div className="relative -mt-12 sm:-mt-24 md:-mt-36 z-30 space-y-3 sm:space-y-5 md:space-y-6">
              {/* If user uploaded videos in their database, highlight them in the top row */}
              {dbVideos.length > 0 && (
                <MovieRow
                  title="✨ Your Uploads & StreamFlix Originals"
                  movies={dbVideos}
                  onPlay={handlePlay}
                  onSelect={handleSelect}
                />
              )}

              {/* Trending Movies Row */}
              <div ref={trendingRef}>
                <MovieRow
                  title="🔥 Trending Movies"
                  movies={CURATED_MOVIES.slice(0, 6)}
                  onPlay={handlePlay}
                  onSelect={handleSelect}
                />
              </div>

              {/* Binge-Worthy Web Series Row */}
              <MovieRow
                title="📺 Binge-Worthy Web Series"
                movies={CURATED_SERIES.slice(0, 6)}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              {/* Blockbuster Top Picks */}
              <MovieRow
                title="🍿 Top Movie Picks for Tonight"
                movies={CURATED_MOVIES.slice(2, 8)}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              {/* Dark Crime & Thrillers Web Series */}
              <MovieRow
                title="☕ Crime, Dark & Mystery Shows"
                movies={CURATED_SERIES.slice(2, 8)}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              {/* Sci-Fi & Cyberpunk Adventures */}
              <MovieRow
                title="🚀 Sci-Fi & Cyberpunk Hits"
                movies={[
                  CURATED_MOVIES[1],
                  CURATED_SERIES[0],
                  CURATED_MOVIES[8],
                  CURATED_SERIES[10],
                  CURATED_MOVIES[0],
                  CURATED_SERIES[8],
                ]}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />

              {/* Award-Winning Row */}
              <MovieRow
                title="🏆 Award-Winning Cinematic Masterpieces"
                movies={ALL_CURATED_MEDIA.filter((m) => m.isOriginal).slice(0, 8)}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />
            </div>
          )}
        </main>
      )}

      {/* Video Playback & Detail Modal */}
      <VideoModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPlayMovie={handlePlay}
        similarMovies={allMedia.filter((m) => m.id !== selectedMovie?.id && m.type === selectedMovie?.type)}
      />

      {/* ImageKit / Video Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          loadVideos();
        }}
      />

      {/* Classic Netflix Multi-column Footer */}
      <Footer />

      {/* Mobile Native Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={mobileTab}
        onHomeClick={handleHomeClick}
        onSearchClick={() => {
          setMobileTab("search");
          window.scrollTo({ top: 0, behavior: "smooth" });
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
        }}
        onUploadClick={() => setIsUploadOpen(true)}
        onTrendingClick={scrollToTrending}
        onProfileClick={() => {
          window.location.href = "/login";
        }}
      />
    </div>
  );
}
