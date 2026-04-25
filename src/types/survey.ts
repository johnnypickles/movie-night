import { type Mood } from "@/lib/survey-weights";

// Max MPAA rating to include. null = no restriction.
export type MaxCertification = "G" | "PG" | "PG-13" | "R" | null;

export interface SurveyData {
  mood: Mood;
  vibeWords: string[];
  genreLikes: number[];
  genreDislikes: number[];
  decadeMin: number | null;
  decadeMax: number | null;
  maxRuntime: number | null;
  minRating: number | null;
  favoriteMovieIds: number[];
  noSubtitles: boolean;
  noBlackWhite: boolean;
  noAnimation: boolean;
  noHorror: boolean;
  maxCertification: MaxCertification;
  /** TMDB watch-provider IDs the user has access to. Empty = no filter. */
  streamingProviders: number[];
  wildCard: string | null;
}

// TMDB watch-provider IDs (US region).
export const STREAMING_PROVIDERS: { id: number; name: string }[] = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Prime Video" },
  { id: 337, name: "Disney+" },
  { id: 1899, name: "Max" },
  { id: 15, name: "Hulu" },
  { id: 350, name: "Apple TV+" },
  { id: 387, name: "Peacock" },
  { id: 531, name: "Paramount+" },
  { id: 257, name: "fuboTV" },
  { id: 386, name: "Paramount+ Showtime" },
];

export const VIBE_WORDS = [
  "funny",
  "heartwarming",
  "suspenseful",
  "dark",
  "uplifting",
  "quirky",
  "nostalgic",
  "cerebral",
  "emotional",
  "lighthearted",
  "gritty",
  "whimsical",
  "tense",
  "beautiful",
  "weird",
  "cozy",
] as const;

export type VibeWord = (typeof VIBE_WORDS)[number];
