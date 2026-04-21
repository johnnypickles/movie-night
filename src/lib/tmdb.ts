const TMDB_BASE = "https://api.themoviedb.org/3";

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  adult: boolean;
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number | null;
  genres: { id: number; name: string }[];
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface DiscoverParams {
  genreIds?: number[];
  genreIdsOr?: number[];
  minRating?: number;
  maxRuntime?: number;
  decadeMin?: number;
  decadeMax?: number;
  language?: string;
  sortBy?: string;
  page?: number;
  excludeGenres?: number[];
  /** MPAA code: "G" | "PG" | "PG-13" | "R". Filters to this or stricter. */
  maxCertification?: string;
  /** Country code for certification lookup (default US). */
  certificationCountry?: string;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY not configured");

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const cacheKey = url.toString();
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  setCache(cacheKey, data);
  return data as T;
}

export const tmdb = {
  async discoverMovies(params: DiscoverParams): Promise<TMDBResponse> {
    const queryParams: Record<string, string> = {
      sort_by: params.sortBy ?? "popularity.desc",
      page: String(params.page ?? 1),
      "vote_count.gte": "50", // Ensure enough votes for reliability
    };

    if (params.genreIds?.length) {
      queryParams.with_genres = params.genreIds.join(","); // AND
    }
    if (params.genreIdsOr?.length) {
      queryParams.with_genres = params.genreIdsOr.join("|"); // OR
    }
    if (params.excludeGenres?.length) {
      queryParams.without_genres = params.excludeGenres.join(",");
    }
    if (params.minRating) {
      queryParams["vote_average.gte"] = String(params.minRating);
    }
    if (params.maxRuntime) {
      queryParams["with_runtime.lte"] = String(params.maxRuntime);
    }
    if (params.decadeMin) {
      queryParams["primary_release_date.gte"] = `${params.decadeMin}-01-01`;
    }
    if (params.decadeMax) {
      queryParams["primary_release_date.lte"] = `${params.decadeMax}-12-31`;
    }
    if (params.language) {
      queryParams.with_original_language = params.language;
    }
    if (params.maxCertification) {
      queryParams.certification_country =
        params.certificationCountry ?? "US";
      queryParams["certification.lte"] = params.maxCertification;
    }

    return tmdbFetch<TMDBResponse>("/discover/movie", queryParams);
  },

  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    return tmdbFetch<TMDBMovieDetails>(`/movie/${movieId}`);
  },

  async getSimilarMovies(movieId: number, page = 1): Promise<TMDBResponse> {
    return tmdbFetch<TMDBResponse>(`/movie/${movieId}/similar`, {
      page: String(page),
    });
  },

  async getRecommendations(movieId: number, page = 1): Promise<TMDBResponse> {
    return tmdbFetch<TMDBResponse>(`/movie/${movieId}/recommendations`, {
      page: String(page),
    });
  },

  async searchMovies(query: string, page = 1): Promise<TMDBResponse> {
    return tmdbFetch<TMDBResponse>("/search/movie", {
      query,
      page: String(page),
    });
  },

  posterUrl(path: string | null, size: "w92" | "w185" | "w342" | "w500" | "w780" | "original" = "w342"): string | null {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },

  backdropUrl(path: string | null, size: "w300" | "w780" | "w1280" | "original" = "w780"): string | null {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },
};
