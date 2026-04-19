export interface MovieRecommendation {
  id: string;
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  overview: string | null;
  matchScore: number;
  explanation: string;
  rank: number;
  genreIds: number[];
  releaseYear: number | null;
  runtime: number | null;
  voteAverage: number | null;
  votes: number;
  chosen: boolean;
}

export interface GroupPreferences {
  genreScores: Map<number, number>;
  decadeMin: number;
  decadeMax: number;
  maxRuntime: number | null;
  minRating: number;
  excludeGenres: Set<number>;
  favoriteMovieIds: number[];
  watchedMovieIds: Set<number>;
  requireEnglish: boolean;
  participantCount: number;
}
