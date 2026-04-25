import { tmdb, type TMDBMovie } from "./tmdb";
import { MOOD_GENRE_MAP, GENRE_LABELS, type Mood } from "./survey-weights";
import type { SurveyData } from "@/types/survey";
import type { GroupPreferences } from "@/types/recommendation";

// ─── Phase 1: Aggregate Group Preferences ──────────────

export function aggregatePreferences(
  surveys: SurveyData[],
  watchedMovieIds: Set<number> = new Set()
): GroupPreferences {
  const count = surveys.length;
  const genreScores = new Map<number, number>();
  let decadeMinValues: number[] = [];
  let decadeMaxValues: number[] = [];
  let runtimeValues: number[] = [];
  let ratingValues: number[] = [];
  let requireEnglish = false;
  const excludeGenres = new Set<number>();
  const favoriteMovieIds: number[] = [];

  for (const survey of surveys) {
    // Apply mood-based genre weights
    const moodGenres = MOOD_GENRE_MAP[survey.mood];
    for (const { id, weight } of moodGenres) {
      genreScores.set(id, (genreScores.get(id) ?? 0) + weight);
    }

    // Apply explicit genre likes/dislikes
    for (const genreId of survey.genreLikes) {
      genreScores.set(genreId, (genreScores.get(genreId) ?? 0) + 1);
    }
    for (const genreId of survey.genreDislikes) {
      genreScores.set(genreId, (genreScores.get(genreId) ?? 0) - 1);
    }

    // Collect decade preferences
    if (survey.decadeMin) decadeMinValues.push(survey.decadeMin);
    if (survey.decadeMax) decadeMaxValues.push(survey.decadeMax);

    // Collect runtime and rating preferences
    if (survey.maxRuntime) runtimeValues.push(survey.maxRuntime);
    if (survey.minRating) ratingValues.push(survey.minRating);

    // Collect favorites
    favoriteMovieIds.push(...survey.favoriteMovieIds);

    // Dealbreakers: if ANY person has it, it applies
    if (survey.noSubtitles) requireEnglish = true;
    if (survey.noAnimation) excludeGenres.add(16); // Animation
    if (survey.noHorror) excludeGenres.add(27); // Horror
  }

  // Max certification: strictest wins. null means "no restriction".
  const CERT_ORDER: Record<"G" | "PG" | "PG-13" | "R", number> = {
    G: 0,
    PG: 1,
    "PG-13": 2,
    R: 3,
  };
  let strictestCert: "G" | "PG" | "PG-13" | "R" | null = null;
  for (const s of surveys) {
    const c = s.maxCertification;
    if (!c) continue;
    if (!strictestCert || CERT_ORDER[c] < CERT_ORDER[strictestCert]) {
      strictestCert = c;
    }
  }

  // Normalize genre scores by participant count
  for (const [id, score] of genreScores) {
    genreScores.set(id, score / count);
  }

  // Decade: find overlapping range, fallback to union
  const decadeMin =
    decadeMinValues.length > 0 ? Math.max(...decadeMinValues) : 1950;
  const decadeMax =
    decadeMaxValues.length > 0 ? Math.min(...decadeMaxValues) : new Date().getFullYear();

  // Runtime: respect the person with least patience
  const maxRuntime =
    runtimeValues.length > 0 ? Math.min(...runtimeValues) : null;

  // Rating: respect the highest standards
  const minRating =
    ratingValues.length > 0 ? Math.max(...ratingValues) : 5.0;

  return {
    genreScores,
    decadeMin: decadeMin > decadeMax ? Math.min(...(decadeMinValues.length ? decadeMinValues : [1950])) : decadeMin,
    decadeMax: decadeMin > decadeMax ? Math.max(...(decadeMaxValues.length ? decadeMaxValues : [new Date().getFullYear()])) : decadeMax,
    maxRuntime,
    minRating,
    excludeGenres,
    favoriteMovieIds: [...new Set(favoriteMovieIds)],
    watchedMovieIds,
    requireEnglish,
    maxCertification: strictestCert,
    participantCount: count,
  };
}

// ─── Phase 2: Generate Candidate Movies ────────────────

interface ScoredMovie extends TMDBMovie {
  _source: "discover" | "similar" | "recommendation";
  _score: number;
}

export async function generateCandidates(
  prefs: GroupPreferences
): Promise<ScoredMovie[]> {
  const candidates = new Map<number, ScoredMovie>();

  // Get top genres (positive scores, sorted)
  const topGenres = [...prefs.genreScores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  const primaryGenres = topGenres.slice(0, 3);
  const secondaryGenres = topGenres.slice(3, 6);

  const baseParams = {
    decadeMin: prefs.decadeMin,
    decadeMax: prefs.decadeMax,
    maxRuntime: prefs.maxRuntime ?? undefined,
    minRating: prefs.minRating,
    language: prefs.requireEnglish ? "en" : undefined,
    excludeGenres: [...prefs.excludeGenres],
    maxCertification: prefs.maxCertification ?? undefined,
  };

  // Run parallel TMDB queries
  const queries: Promise<void>[] = [];

  // Query 1: Primary genres by popularity
  if (primaryGenres.length > 0) {
    queries.push(
      (async () => {
        for (let page = 1; page <= 3; page++) {
          try {
            const res = await tmdb.discoverMovies({
              ...baseParams,
              genreIdsOr: primaryGenres,
              sortBy: "popularity.desc",
              page,
            });
            for (const movie of res.results) {
              if (!candidates.has(movie.id) && !prefs.watchedMovieIds.has(movie.id)) {
                candidates.set(movie.id, { ...movie, _source: "discover", _score: 0 });
              }
            }
          } catch {
            // Continue on error
          }
        }
      })()
    );
  }

  // Query 2: Secondary genres by vote average
  if (secondaryGenres.length > 0) {
    queries.push(
      (async () => {
        try {
          const res = await tmdb.discoverMovies({
            ...baseParams,
            genreIdsOr: secondaryGenres,
            sortBy: "vote_average.desc",
            page: 1,
          });
          for (const movie of res.results) {
            if (!candidates.has(movie.id) && !prefs.watchedMovieIds.has(movie.id)) {
              candidates.set(movie.id, { ...movie, _source: "discover", _score: 0 });
            }
          }
        } catch {
          // Continue on error
        }
      })()
    );
  }

  // Query 3: Similar movies from favorites
  for (const favoriteId of prefs.favoriteMovieIds.slice(0, 5)) {
    queries.push(
      (async () => {
        try {
          const res = await tmdb.getSimilarMovies(favoriteId);
          for (const movie of res.results) {
            if (!candidates.has(movie.id) && !prefs.watchedMovieIds.has(movie.id)) {
              candidates.set(movie.id, { ...movie, _source: "similar", _score: 0 });
            }
          }
        } catch {
          // Continue on error
        }
      })()
    );

    // Query 4: TMDB recommendations from favorites
    queries.push(
      (async () => {
        try {
          const res = await tmdb.getRecommendations(favoriteId);
          for (const movie of res.results) {
            if (!candidates.has(movie.id) && !prefs.watchedMovieIds.has(movie.id)) {
              candidates.set(movie.id, {
                ...movie,
                _source: "recommendation",
                _score: 0,
              });
            }
          }
        } catch {
          // Continue on error
        }
      })()
    );
  }

  await Promise.all(queries);

  return [...candidates.values()];
}

// ─── Phase 3: Score Candidates ─────────────────────────

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(max, ((value - min) / (max - min)) * max));
}

export function scoreMovie(
  movie: ScoredMovie,
  prefs: GroupPreferences
): number {
  let score = 0;
  const movieGenres = new Set(movie.genre_ids);
  const currentYear = new Date().getFullYear();

  // 1. Genre alignment (0-30 points)
  let genreScore = 0;
  for (const [genreId, weight] of prefs.genreScores) {
    if (movieGenres.has(genreId)) {
      genreScore += weight;
    }
  }
  // Normalize: max possible genre score ≈ participantCount (if all genres match perfectly)
  score += Math.min(30, (genreScore / Math.max(1, prefs.participantCount)) * 30);

  // 2. Rating quality (0-20 points)
  score += Math.min(20, (movie.vote_average / 10) * 20);

  // 3. Popularity signal (0-10 points) — log-scaled to avoid blockbuster bias
  score += Math.min(10, Math.log10(Math.max(1, movie.popularity)) * 3);

  // 4. Taste similarity bonus (0-25 points)
  if (movie._source === "recommendation") score += 25;
  else if (movie._source === "similar") score += 18;

  // 5. Recency bonus (0-10 points)
  const releaseYear = movie.release_date
    ? parseInt(movie.release_date.slice(0, 4), 10)
    : currentYear;
  const age = currentYear - releaseYear;
  score += Math.max(0, 10 - age * 0.3);

  // 6. Vote count confidence (0-5 points)
  score += Math.min(5, Math.log10(Math.max(1, movie.vote_count)));

  // Penalty: if movie has excluded genres
  for (const genreId of prefs.excludeGenres) {
    if (movieGenres.has(genreId)) {
      score -= 30; // Heavy penalty
    }
  }

  return Math.max(0, Math.round(score));
}

// ─── Phase 4: Select Diverse Top Results ───────────────

function genreOverlap(a: number[], b: number[]): number {
  const setB = new Set(b);
  let overlap = 0;
  for (const id of a) {
    if (setB.has(id)) overlap++;
  }
  return overlap / Math.max(1, Math.max(a.length, b.length));
}

export function selectTopMovies(
  candidates: ScoredMovie[],
  prefs: GroupPreferences,
  count: number = 5
): ScoredMovie[] {
  // Score all candidates
  for (const movie of candidates) {
    movie._score = scoreMovie(movie, prefs);
  }

  // Sort by score descending
  candidates.sort((a, b) => b._score - a._score);

  // Select with diversity
  const selected: ScoredMovie[] = [];
  for (const movie of candidates) {
    if (selected.length >= count) break;

    // Apply diversity penalty for genre overlap with already-selected
    let diversityPenalty = 0;
    for (const existing of selected) {
      const overlap = genreOverlap(movie.genre_ids, existing.genre_ids);
      diversityPenalty += overlap * 10;
    }

    const adjustedScore = movie._score - diversityPenalty;
    if (adjustedScore > 0 || selected.length < 2) {
      movie._score = Math.max(0, adjustedScore);
      selected.push(movie);
    }
  }

  // Re-rank by adjusted score
  selected.sort((a, b) => b._score - a._score);
  return selected;
}

// ─── Phase 5: Generate Explanations ────────────────────

export function generateExplanation(
  movie: ScoredMovie,
  prefs: GroupPreferences
): string {
  const reasons: string[] = [];
  const movieGenres = new Set(movie.genre_ids);

  // Genre match
  const matchedGenres = [...prefs.genreScores.entries()]
    .filter(([id, score]) => movieGenres.has(id) && score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => GENRE_LABELS[id] || "Unknown");

  if (matchedGenres.length > 0) {
    reasons.push(
      `Matches the group's love for ${matchedGenres.join(" and ")}`
    );
  }

  // Source bonus
  if (movie._source === "recommendation" || movie._source === "similar") {
    reasons.push("Similar to movies the group already loves");
  }

  // Rating
  if (movie.vote_average >= 8.0) {
    reasons.push(`Critically acclaimed with ${movie.vote_average.toFixed(1)}/10`);
  } else if (movie.vote_average >= 7.0) {
    reasons.push(`Highly rated at ${movie.vote_average.toFixed(1)}/10`);
  }

  // Popularity
  if (movie.popularity > 100) {
    reasons.push("Widely popular and well-known");
  }

  if (reasons.length === 0) {
    reasons.push("A solid pick that balances everyone's preferences");
  }

  return reasons.join(". ") + ".";
}

// ─── Shortlist Mode ────────────────────────────────────

export async function getShortlistRecommendations(
  surveys: SurveyData[],
  candidateMovieIds: number[],
  watchedMovieIds: Set<number> = new Set(),
  options: { excludeMovieIds?: Set<number>; count?: number } = {}
): Promise<
  {
    movie: ScoredMovie;
    explanation: string;
    matchScore: number;
    rank: number;
  }[]
> {
  const exclude = options.excludeMovieIds ?? new Set<number>();
  const ids = candidateMovieIds.filter((id) => !exclude.has(id));
  const prefs = aggregatePreferences(surveys, watchedMovieIds);

  // Fetch full details for each candidate in parallel
  const details = await Promise.all(
    ids.map(async (id) => {
      try {
        const d = await tmdb.getMovieDetails(id);
        return d;
      } catch {
        return null;
      }
    })
  );

  const candidates: ScoredMovie[] = details
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .map((d) => ({
      id: d.id,
      title: d.title,
      overview: d.overview,
      poster_path: d.poster_path,
      backdrop_path: d.backdrop_path,
      genre_ids: d.genres.map((g) => g.id),
      release_date: d.release_date,
      vote_average: d.vote_average,
      vote_count: d.vote_count,
      popularity: d.popularity,
      original_language: d.original_language,
      adult: d.adult,
      _source: "discover" as const,
      _score: 0,
    }));

  if (candidates.length === 0) return [];

  // Score every candidate — no filtering out, no diversity penalty
  for (const movie of candidates) {
    movie._score = scoreMovie(movie, prefs);
  }
  candidates.sort((a, b) => b._score - a._score);

  const maxScore = Math.max(...candidates.map((m) => m._score), 1);

  return candidates.map((movie, index) => ({
    movie,
    explanation: generateExplanation(movie, prefs),
    matchScore: Math.round((movie._score / maxScore) * 100),
    rank: index + 1,
  }));
}

// ─── Main Entry Point ──────────────────────────────────

export async function getRecommendations(
  surveys: SurveyData[],
  watchedMovieIds: Set<number> = new Set(),
  options: { excludeMovieIds?: Set<number>; count?: number } = {}
): Promise<
  {
    movie: ScoredMovie;
    explanation: string;
    matchScore: number;
    rank: number;
  }[]
> {
  const count = options.count ?? 5;
  const exclude = options.excludeMovieIds ?? new Set<number>();

  // Step 1: Aggregate
  const prefs = aggregatePreferences(surveys, watchedMovieIds);

  // Step 2: Generate candidates, then drop any in the exclude set
  const allCandidates = await generateCandidates(prefs);
  const candidates = allCandidates.filter((m) => !exclude.has(m.id));

  if (candidates.length === 0) {
    return [];
  }

  // Step 3: Score and select top N
  const topMovies = selectTopMovies(candidates, prefs, count);

  // Step 4: Generate explanations
  const maxScore = Math.max(...topMovies.map((m) => m._score), 1);

  return topMovies.map((movie, index) => ({
    movie,
    explanation: generateExplanation(movie, prefs),
    matchScore: Math.round((movie._score / maxScore) * 100),
    rank: index + 1,
  }));
}
