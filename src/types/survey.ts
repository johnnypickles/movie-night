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
  wildCard: string | null;
}

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
