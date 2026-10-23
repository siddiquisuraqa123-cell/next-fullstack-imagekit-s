import { FeaturedMovie } from "@/app/components/HeroBanner";

// Curated Cinematic Full-Length Movies (12 completely distinct titles & images)
export const CURATED_MOVIES: FeaturedMovie[] = [
  {
    id: "movie-1",
    title: "Cosmos: Interstellar Horizon",
    description:
      "When deep-space probes detect an artificial gravitational lens near Saturn, an elite crew embarks on humanity's first expedition beyond known spacetime to confront an ancient intelligence.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    matchScore: 99,
    rating: "18+",
    duration: "2h 28m",
    tags: ["Deep Space", "Sci-Fi", "Mind-Bending", "Visually Striking"],
    isOriginal: true,
    type: "movie",
    genre: "Sci-Fi",
    releaseYear: "2026",
  },
  {
    id: "movie-2",
    title: "Tears of Steel: Resurgence",
    description:
      "In a neon-drenched dystopian Amsterdam, rogue technicians launch an audacious tactical strike against towering robotic overlords to undo the cataclysm that fractured mankind.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
    matchScore: 97,
    rating: "16+",
    duration: "1h 56m",
    tags: ["Cyberpunk", "Action", "Mecha", "Dystopian"],
    isOriginal: true,
    type: "movie",
    genre: "Action",
    releaseYear: "2025",
  },
  {
    id: "movie-3",
    title: "Apex Velocity: Midnight Pursuit",
    description:
      "An undercover wheelman is pulled into an international hypercar smuggling syndicate where high-speed nocturnal street chases across Tokyo decide who survives the night.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80",
    matchScore: 98,
    rating: "16+",
    duration: "2h 05m",
    tags: ["High Octane", "Street Racing", "Action", "Adrenaline"],
    isOriginal: false,
    type: "movie",
    genre: "Action",
    releaseYear: "2026",
  },
  {
    id: "movie-4",
    title: "The Shadow Syndicate",
    description:
      "Under rainy neon alleyways, a battle-hardened detective uncovers a multi-billion dollar syndicate trafficking stolen human memories through untraceable neural networks.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
    matchScore: 96,
    rating: "18+",
    duration: "2h 14m",
    tags: ["Neo-Noir", "Crime Thriller", "Gritty", "Mystery"],
    isOriginal: true,
    type: "movie",
    genre: "Crime",
    releaseYear: "2025",
  },
  {
    id: "movie-5",
    title: "Chronicles of the Dragon Citadel",
    description:
      "A dispossessed warrior journeys across sun-scorched badlands to liberate an imprisoned primordial dragon and reclaim her ancestral kingdom from tyrannical sorcerers.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1533158307587-828f0a76ef46?w=1200&auto=format&fit=crop&q=80",
    matchScore: 95,
    rating: "13+",
    duration: "1h 50m",
    tags: ["Epic Fantasy", "Adventure", "Mythology", "Action"],
    isOriginal: false,
    type: "movie",
    genre: "Fantasy",
    releaseYear: "2024",
  },
  {
    id: "movie-6",
    title: "Sub-Zero: Mariana Abyss",
    description:
      "Seven miles beneath the ocean surface, the crew of a deep-sea research rig awakens a colossal prehistoric bio-weapon dormant for millions of years.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=1200&auto=format&fit=crop&q=80",
    matchScore: 94,
    rating: "16+",
    duration: "1h 58m",
    tags: ["Oceanic Horror", "Survival", "Sci-Fi", "Intense"],
    isOriginal: true,
    type: "movie",
    genre: "Thriller",
    releaseYear: "2026",
  },
  {
    id: "movie-7",
    title: "Dune Nomad: Wasteland Exodus",
    description:
      "In a drought-ravaged post-apocalyptic continent, an armored caravan fights across ruthless warlord territories to reach the last surviving subterranean reservoir.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80",
    matchScore: 93,
    rating: "16+",
    duration: "2h 10m",
    tags: ["Post-Apocalyptic", "Survival", "Action", "Epic"],
    isOriginal: false,
    type: "movie",
    genre: "Action",
    releaseYear: "2025",
  },
  {
    id: "movie-8",
    title: "Blade of the Shogun",
    description:
      "A dishonored samurai embarks on a blood-soaked vendetta against the corrupt warlords who slaughtered his clan, wielding a legendary folded-steel katana.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80",
    matchScore: 97,
    rating: "18+",
    duration: "2h 02m",
    tags: ["Martial Arts", "Historical Epic", "Revenge", "Gritty"],
    isOriginal: true,
    type: "movie",
    genre: "Action",
    releaseYear: "2025",
  },
  {
    id: "movie-9",
    title: "Cyber City: Project 2099",
    description:
      "Inside the sky-high monolithic towers of Neo-Singapore, an augmented bio-hacker accidentally downloads the encrypted master key to the global megacorporate grid.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80",
    matchScore: 99,
    rating: "18+",
    duration: "2h 20m",
    tags: ["Cyberpunk", "Futuristic", "Thriller", "Sci-Fi"],
    isOriginal: true,
    type: "movie",
    genre: "Sci-Fi",
    releaseYear: "2026",
  },
  {
    id: "movie-10",
    title: "The Alpine Recon",
    description:
      "Trapped behind enemy lines on a blizzard-shrouded peak, an elite military search-and-rescue team defends a high-value defector against relentless mercenary assault.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
    matchScore: 92,
    rating: "16+",
    duration: "1h 48m",
    tags: ["Military Thriller", "Snow", "Survival", "Action"],
    isOriginal: false,
    type: "movie",
    genre: "Action",
    releaseYear: "2024",
  },
  {
    id: "movie-11",
    title: "Quantum Rift",
    description:
      "An experimental particle collider triggers a localized quantum tear, causing alternate timeline versions of Earth to collide into a kaleidoscopic battle for reality.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80",
    matchScore: 95,
    rating: "16+",
    duration: "2h 15m",
    tags: ["Multiverse", "Cosmic", "Mind-Bending", "Sci-Fi"],
    isOriginal: true,
    type: "movie",
    genre: "Sci-Fi",
    releaseYear: "2026",
  },
  {
    id: "movie-12",
    title: "Hyperdrive Protocol",
    description:
      "A banned high-speed hovercraft test pilot is recruited for an impossible orbital extraction mission where supersonic velocity is the only weapon against planetary shields.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511875762315-c773eb98eec0?w=1200&auto=format&fit=crop&q=80",
    matchScore: 94,
    rating: "16+",
    duration: "1h 52m",
    tags: ["Supersonic", "Sci-Fi Action", "Adrenaline", "Futuristic"],
    isOriginal: false,
    type: "movie",
    genre: "Action",
    releaseYear: "2025",
  },
];

// Curated Binge-Worthy Web Series & TV Shows (12 completely distinct titles & images)
export const CURATED_SERIES: FeaturedMovie[] = [
  {
    id: "series-1",
    title: "The Midnight Protocol",
    description:
      "In the shadowy corners of the dark web, a reclusive hacker collective unearths an autonomous surveillance AI that is quietly assassinating government whistleblowers.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    matchScore: 99,
    rating: "18+",
    seasons: "3 Seasons",
    duration: "10 Episodes",
    tags: ["Cybercrime", "Tech Thriller", "Conspiracy", "Mind-Bending"],
    isOriginal: true,
    type: "series",
    genre: "Sci-Fi",
    releaseYear: "2026",
  },
  {
    id: "series-2",
    title: "Hawkins Hollow: Dark Origins",
    description:
      "When a series of teenagers vanish into the misty woods of a 1980s Pacific Northwest logging town, a sheriff and four curious kids stumble upon a portal into an upside-down realm.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    matchScore: 98,
    rating: "16+",
    seasons: "4 Seasons",
    duration: "8 Episodes",
    tags: ["Supernatural", "Retro 80s", "Mystery", "Creepy"],
    isOriginal: true,
    type: "series",
    genre: "Mystery",
    releaseYear: "2025",
  },
  {
    id: "series-3",
    title: "Synthwave Nights",
    description:
      "Under neon palm trees and pink sunset horizons, a duo of undercover vice detectives infiltrate an ultra-glamorous Miami nightlife syndicate laundering biometric cryptocurrency.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop&q=80",
    matchScore: 97,
    rating: "18+",
    seasons: "2 Seasons",
    duration: "12 Episodes",
    tags: ["80s Synth", "Crime Drama", "Stylish", "Action"],
    isOriginal: false,
    type: "series",
    genre: "Crime",
    releaseYear: "2026",
  },
  {
    id: "series-4",
    title: "Dynasty of the Iron Throne",
    description:
      "Noble families clash in backroom betrayals, arranged royal marriages, and brutal battlefield skirmishes to seize the supreme imperial throne of a fractured medieval empire.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80",
    matchScore: 98,
    rating: "18+",
    seasons: "5 Seasons",
    duration: "10 Episodes",
    tags: ["Political Intrigue", "Medieval Drama", "Epic", "Power Struggle"],
    isOriginal: true,
    type: "series",
    genre: "Drama",
    releaseYear: "2024",
  },
  {
    id: "series-5",
    title: "Cold Case Files: Unit 9",
    description:
      "A forensic behavioral psychologist and a disgraced detective reopen unsolved cold murders across three decades, connecting a single ghost serial killer hidden in plain sight.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80",
    matchScore: 96,
    rating: "18+",
    seasons: "Limited Series",
    duration: "6 Episodes",
    tags: ["Psychological Thriller", "Detective", "True Crime", "Dark"],
    isOriginal: true,
    type: "series",
    genre: "Crime",
    releaseYear: "2026",
  },
  {
    id: "series-6",
    title: "Shinjuku Underworld",
    description:
      "In the labyrinthine alleyways of Tokyo, an ambitious young lieutenant in a storied Yakuza clan navigates clan wars, corporate betrayal, and the ruthless modern underworld.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80",
    matchScore: 97,
    rating: "18+",
    seasons: "3 Seasons",
    duration: "8 Episodes",
    tags: ["Yakuza", "Tokyo Crime", "Intense", "Gritty"],
    isOriginal: false,
    type: "series",
    genre: "Crime",
    releaseYear: "2025",
  },
  {
    id: "series-7",
    title: "Desert Empire: The Border Wars",
    description:
      "Spanning both sides of the Rio Grande, a sprawling saga chronicles the rise and fall of a modern desert cartel dynasty battling DEA tacticians and rival syndicates.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1200&auto=format&fit=crop&q=80",
    matchScore: 95,
    rating: "18+",
    seasons: "4 Seasons",
    duration: "10 Episodes",
    tags: ["Cartel Drama", "High Stakes", "Gritty", "Action"],
    isOriginal: true,
    type: "series",
    genre: "Crime",
    releaseYear: "2024",
  },
  {
    id: "series-8",
    title: "St. Jude Trauma Ward",
    description:
      "Inside the country's most chaotic Level-1 trauma center, a team of brilliant surgeons, residents, and nurses make split-second life-or-death decisions while wrestling personal demons.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80",
    matchScore: 93,
    rating: "16+",
    seasons: "6 Seasons",
    duration: "14 Episodes",
    tags: ["Medical Drama", "Emotional", "Fast-Paced", "Heartfelt"],
    isOriginal: false,
    type: "series",
    genre: "Drama",
    releaseYear: "2025",
  },
  {
    id: "series-9",
    title: "Colony Europa: Deep Orbit",
    description:
      "Living beneath the ice crust of Jupiter's moon Europa, colonial drillers discover a warm thermal ocean teeming with sentient extraterrestrial ecosystems.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80",
    matchScore: 97,
    rating: "16+",
    seasons: "2 Seasons",
    duration: "8 Episodes",
    tags: ["Hard Sci-Fi", "Alien Life", "Suspense", "Deep Space"],
    isOriginal: true,
    type: "series",
    genre: "Sci-Fi",
    releaseYear: "2026",
  },
  {
    id: "series-10",
    title: "The Haunting of Blackwood Hall",
    description:
      "An estranged family gathers at their ancestral English manor for the reading of a patriarch's will, only to discover the house itself feeds on their deepest suppressed traumas.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&auto=format&fit=crop&q=80",
    matchScore: 94,
    rating: "18+",
    seasons: "Limited Series",
    duration: "7 Episodes",
    tags: ["Gothic Horror", "Haunted House", "Chilling", "Atmospheric"],
    isOriginal: true,
    type: "series",
    genre: "Horror",
    releaseYear: "2025",
  },
  {
    id: "series-11",
    title: "Cyber Samurai: Neo Tokyo",
    description:
      "In a neon-splattered virtual reality metropolis, a rogue digital ronin protects an AI child that possesses the consciousness algorithm to liberate synthetic beings.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80",
    matchScore: 98,
    rating: "18+",
    seasons: "2 Seasons",
    duration: "10 Episodes",
    tags: ["Cyberpunk Anime", "Action", "Stylized", "Mind-Bending"],
    isOriginal: false,
    type: "series",
    genre: "Sci-Fi",
    releaseYear: "2026",
  },
  {
    id: "series-12",
    title: "The High Court: Verdict",
    description:
      "Behind the marble columns of the nation's highest judicial chamber, high-stakes defense attorneys risk their careers and safety to expose corruption at the highest level of government.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80",
    matchScore: 92,
    rating: "16+",
    seasons: "3 Seasons",
    duration: "9 Episodes",
    tags: ["Legal Thriller", "Courtroom", "Intrigue", "Suspense"],
    isOriginal: true,
    type: "series",
    genre: "Drama",
    releaseYear: "2025",
  },
];

// Combined full catalogue
export const ALL_CURATED_MEDIA: FeaturedMovie[] = [
  ...CURATED_MOVIES,
  ...CURATED_SERIES,
];
