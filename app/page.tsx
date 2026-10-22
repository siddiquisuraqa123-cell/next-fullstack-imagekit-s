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

// Curated Cinematic Default Catalog with high-res thumbnails and open trailers
const CURATED_CATALOG: FeaturedMovie[] = [
  {
    id: "curated-1",
    title: "Cosmos Laundromat",
    description:
      "On a desolate island, a suicidal sheep named Franck meets a quirky salesman who offers him the gift of a lifetime: a magical journey through parallel realities and cosmic wonders.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    matchScore: 99,
    rating: "18+",
    duration: "2h 12m",
    tags: ["Mind-Bending", "Sci-Fi", "Surreal", "Visually Striking"],
    isOriginal: true,
  },
  {
    id: "curated-2",
    title: "Tears of Steel: Resurgence",
    description:
      "Set in a dystopian future where humanity battles towering mechanized forces, a group of rebel technicians and soldiers embark on an audacious experiment to rewrite time.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
    matchScore: 97,
    rating: "16+",
    duration: "1h 56m",
    tags: ["Cyberpunk", "Action", "Dystopian", "Sci-Fi"],
    isOriginal: true,
  },
  {
    id: "curated-3",
    title: "Sub-Zero Horizon",
    description:
      "Trapped aboard an abandoned orbital research outpost, an astrophysics engineer discovers deep-space telemetry signals broadcasting from within the Earth's core.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    matchScore: 95,
    rating: "16+",
    duration: "2h 05m",
    tags: ["Deep Space", "Suspenseful", "Thriller"],
    isOriginal: false,
  },
  {
    id: "curated-4",
    title: "The Neon Syndicate",
    description:
      "Underneath the neon towers of Neo-Shinjuku, an underground data-smuggler uncovers a conspiracy to monopolize the consciousness of millions through biometric networks.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
    matchScore: 98,
    rating: "18+",
    duration: "1h 48m",
    tags: ["Neo-Noir", "Crime", "Action", "Gritty"],
    isOriginal: true,
  },
  {
    id: "curated-5",
    title: "Chronicles of Sintel",
    description:
      "A fierce lone wanderer treks across treacherous frozen peaks and sun-bleached canyons in relentless search of a stolen dragon companion that holds the secret of her lost ancestry.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
    matchScore: 94,
    rating: "13+",
    duration: "1h 42m",
    tags: ["Epic Fantasy", "Adventure", "Emotional"],
    isOriginal: false,
  },
  {
    id: "curated-6",
    title: "Velocity Protocol",
    description:
      "A prototype hover-craft racer is recruited into a clandestine military infiltration league where high-speed maneuvers are the only weapon against rogue surveillance drones.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511875762315-c773eb98eec0?w=1200&auto=format&fit=crop&q=80",
    matchScore: 96,
    rating: "16+",
    duration: "2h 14m",
    tags: ["High Octane", "Racing", "Adrenaline"],
    isOriginal: true,
  },
  {
    id: "curated-7",
    title: "Shadows of the Abyss",
    description:
      "Marine biologists descending into the Puerto Rico Trench lose communication with their surface vessel when bioluminescent leviathans awaken from the sea floor.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=1200&auto=format&fit=crop&q=80",
    matchScore: 93,
    rating: "16+",
    duration: "1h 50m",
    tags: ["Oceanic Horror", "Survival", "Mystery"],
    isOriginal: false,
  },
  {
    id: "curated-8",
    title: "Apex Predator",
    description:
      "In the dense primeval rainforests of the Congo, an elite expedition faces an uncatalogued apex predator engineered by covert gene-splicing cartels.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    matchScore: 96,
    rating: "18+",
    duration: "2h 01m",
    tags: ["Action Thriller", "Wilderness", "Suspense"],
    isOriginal: true,
  },
];

export default function Home() {
  const [dbVideos, setDbVideos] = useState<FeaturedMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<FeaturedMovie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Home");
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

  // Combine database videos with curated catalog
  const allMovies = useMemo(() => {
    return [...dbVideos, ...CURATED_CATALOG];
  }, [dbVideos]);

  // Featured billboard movie
  const heroMovie = useMemo(() => {
    return allMovies[0] || CURATED_CATALOG[0];
  }, [allMovies]);

  // Filtered list when search query is active
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allMovies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [allMovies, searchQuery]);

  // Category Filtering
  const displayedCatalog = useMemo(() => {
    if (activeCategory === "TV Shows") {
      return CURATED_CATALOG.filter((_, idx) => idx % 2 === 0);
    }
    if (activeCategory === "Movies") {
      return CURATED_CATALOG.filter((_, idx) => idx % 2 === 1);
    }
    if (activeCategory === "My List") {
      return dbVideos.length > 0 ? dbVideos : CURATED_CATALOG.slice(0, 4);
    }
    return CURATED_CATALOG;
  }, [activeCategory, dbVideos]);

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
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-2 sm:p-3 flex flex-col justify-end">
                    <h3 className="font-bold text-[11px] sm:text-sm text-white truncate">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-zinc-300 mt-0.5">
                      <span className="text-emerald-400 font-bold">
                        {movie.matchScore}% Match
                      </span>
                      <span>{movie.duration}</span>
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
                Suggestions: Try different keywords, genres, or check your spelling.
              </p>
            </div>
          )}
        </main>
      ) : (
        /* Normal Netflix Homepage Layout */
        <main className="relative pb-8 sm:pb-16">
          {/* Hero Featured Billboard Banner */}
          <HeroBanner
            movie={heroMovie}
            onPlay={handlePlay}
            onMoreInfo={handleSelect}
          />

          {/* Negative top margin pulls rows up over hero gradient bottom */}
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

            {/* Trending Now Row */}
            <div ref={trendingRef}>
              <MovieRow
                title="🔥 Trending Now"
                movies={displayedCatalog.slice(0, 6)}
                onPlay={handlePlay}
                onSelect={handleSelect}
              />
            </div>

            {/* Top 10 / Blockbusters Row */}
            <MovieRow
              title="🍿 Top Picks for Tonight"
              movies={displayedCatalog.slice(2, 8)}
              onPlay={handlePlay}
              onSelect={handleSelect}
            />

            {/* Action & Sci-Fi Row */}
            <MovieRow
              title="🚀 Sci-Fi & Mind-Bending Adventures"
              movies={[
                ...CURATED_CATALOG.filter((m) =>
                  m.tags?.some((t) => t.includes("Sci-Fi") || t.includes("Action"))
                ),
                ...CURATED_CATALOG.slice(0, 3),
              ]}
              onPlay={handlePlay}
              onSelect={handleSelect}
            />

            {/* Thrillers & Mystery */}
            <MovieRow
              title="🌌 Gripping Thrillers & Cult Classics"
              movies={CURATED_CATALOG.slice(3, 8)}
              onPlay={handlePlay}
              onSelect={handleSelect}
            />

            {/* Award-Winning Row */}
            <MovieRow
              title="🏆 Award-Winning Cinematic Masterpieces"
              movies={[...displayedCatalog].reverse()}
              onPlay={handlePlay}
              onSelect={handleSelect}
            />
          </div>
        </main>
      )}

      {/* Video Playback & Detail Modal */}
      <VideoModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPlayMovie={handlePlay}
        similarMovies={allMovies.filter((m) => m.id !== selectedMovie?.id)}
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
