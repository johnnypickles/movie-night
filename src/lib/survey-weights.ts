// TMDB Genre IDs
export const TMDB_GENRES = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MUSIC: 10402,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIENCE_FICTION: 878,
  TV_MOVIE: 10770,
  THRILLER: 53,
  WAR: 10752,
  WESTERN: 37,
} as const;

export const GENRE_LABELS: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export type Mood =
  | "chill"
  | "adventurous"
  | "intense"
  | "silly"
  | "romantic"
  | "mindBending";

export interface GenreWeight {
  id: number;
  weight: number;
}

// Each mood maps to a weighted blend of genres
export const MOOD_GENRE_MAP: Record<Mood, GenreWeight[]> = {
  chill: [
    { id: TMDB_GENRES.COMEDY, weight: 0.35 },
    { id: TMDB_GENRES.DRAMA, weight: 0.25 },
    { id: TMDB_GENRES.FAMILY, weight: 0.2 },
    { id: TMDB_GENRES.ROMANCE, weight: 0.1 },
    { id: TMDB_GENRES.MUSIC, weight: 0.1 },
  ],
  adventurous: [
    { id: TMDB_GENRES.ACTION, weight: 0.3 },
    { id: TMDB_GENRES.ADVENTURE, weight: 0.3 },
    { id: TMDB_GENRES.SCIENCE_FICTION, weight: 0.2 },
    { id: TMDB_GENRES.FANTASY, weight: 0.15 },
    { id: TMDB_GENRES.WAR, weight: 0.05 },
  ],
  intense: [
    { id: TMDB_GENRES.THRILLER, weight: 0.35 },
    { id: TMDB_GENRES.CRIME, weight: 0.25 },
    { id: TMDB_GENRES.HORROR, weight: 0.2 },
    { id: TMDB_GENRES.MYSTERY, weight: 0.15 },
    { id: TMDB_GENRES.DRAMA, weight: 0.05 },
  ],
  silly: [
    { id: TMDB_GENRES.COMEDY, weight: 0.5 },
    { id: TMDB_GENRES.ANIMATION, weight: 0.2 },
    { id: TMDB_GENRES.FAMILY, weight: 0.15 },
    { id: TMDB_GENRES.ADVENTURE, weight: 0.1 },
    { id: TMDB_GENRES.FANTASY, weight: 0.05 },
  ],
  romantic: [
    { id: TMDB_GENRES.ROMANCE, weight: 0.45 },
    { id: TMDB_GENRES.DRAMA, weight: 0.25 },
    { id: TMDB_GENRES.COMEDY, weight: 0.2 },
    { id: TMDB_GENRES.MUSIC, weight: 0.1 },
  ],
  mindBending: [
    { id: TMDB_GENRES.MYSTERY, weight: 0.3 },
    { id: TMDB_GENRES.SCIENCE_FICTION, weight: 0.3 },
    { id: TMDB_GENRES.THRILLER, weight: 0.25 },
    { id: TMDB_GENRES.DRAMA, weight: 0.1 },
    { id: TMDB_GENRES.FANTASY, weight: 0.05 },
  ],
};

export const MOOD_LABELS: Record<
  Mood,
  { label: string; icon: string; description: string }
> = {
  chill: {
    label: "Chill",
    icon: "Sofa",
    description: "Relaxed, feel-good vibes",
  },
  adventurous: {
    label: "Adventurous",
    icon: "Mountain",
    description: "Epic, exciting journeys",
  },
  intense: {
    label: "Intense",
    icon: "Flame",
    description: "Edge-of-your-seat thrills",
  },
  silly: {
    label: "Silly",
    icon: "PartyPopper",
    description: "Laugh until it hurts",
  },
  romantic: {
    label: "Romantic",
    icon: "Heart",
    description: "Heartfelt and emotional",
  },
  mindBending: {
    label: "Mind-Bending",
    icon: "Brain",
    description: "Twists, puzzles, and wonder",
  },
};
