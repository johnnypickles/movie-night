// Shared helpers for /api/rooms/[code]/recommend, /replace, and /regenerate.
// All three need the same survey data prep + filter sets.

import { prisma } from "./prisma";
import type { SurveyData } from "@/types/survey";
import {
  getRecommendations,
  getShortlistRecommendations,
} from "./recommendation-engine";

export interface RecommendInputs {
  surveys: SurveyData[];
  watchedMovieIds: Set<number>;
  candidateIds: number[]; // for shortlist mode
  mode: "DISCOVER" | "SHORTLIST";
  roomId: string;
}

/**
 * Load a room and produce everything the recommendation engine needs.
 * Throws if the room is missing or surveys are incomplete.
 */
export async function loadRecommendInputs(code: string): Promise<RecommendInputs> {
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      participants: { include: { surveyResponse: true } },
      candidates: true,
    },
  });
  if (!room) throw new Error("Room not found");

  const incomplete = room.participants.filter((p) => !p.surveyCompleted);
  if (incomplete.length > 0) {
    throw new Error(
      `${incomplete.length} participant(s) haven't completed the survey yet`
    );
  }

  const userIds = room.participants
    .map((p) => p.userId)
    .filter((id): id is string => Boolean(id));

  const [ratings, watched] = await Promise.all([
    userIds.length > 0
      ? prisma.movieRating.findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, tmdbMovieId: true, rating: true },
        })
      : Promise.resolve([]),
    userIds.length > 0
      ? prisma.watchHistory.findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, tmdbMovieId: true },
        })
      : Promise.resolve([]),
  ]);

  const userTopRated = new Map<string, number[]>();
  const userDisliked = new Map<string, Set<number>>();
  for (const r of ratings) {
    if (r.rating >= 7) {
      const arr = userTopRated.get(r.userId) ?? [];
      arr.push(r.tmdbMovieId);
      userTopRated.set(r.userId, arr);
    } else if (r.rating <= 4) {
      const set = userDisliked.get(r.userId) ?? new Set();
      set.add(r.tmdbMovieId);
      userDisliked.set(r.userId, set);
    }
  }

  const watchedMovieIds = new Set<number>(
    watched.map((w) => w.tmdbMovieId)
  );
  for (const set of userDisliked.values()) {
    for (const id of set) watchedMovieIds.add(id);
  }

  const surveys: SurveyData[] = room.participants
    .filter((p) => p.surveyResponse)
    .map((p) => {
      const s = p.surveyResponse!;
      const surveyFavs: number[] = JSON.parse(s.favoriteMovieIds);
      const extraFavs = p.userId ? userTopRated.get(p.userId) ?? [] : [];
      const merged = Array.from(new Set([...surveyFavs, ...extraFavs]));
      return {
        mood: s.mood as SurveyData["mood"],
        vibeWords: JSON.parse(s.vibeWords),
        genreLikes: JSON.parse(s.genreLikes),
        genreDislikes: JSON.parse(s.genreDislikes),
        decadeMin: s.decadeMin,
        decadeMax: s.decadeMax,
        maxRuntime: s.maxRuntime,
        minRating: s.minRating,
        favoriteMovieIds: merged,
        noSubtitles: s.noSubtitles,
        noBlackWhite: s.noBlackWhite,
        noAnimation: s.noAnimation,
        noHorror: s.noHorror,
        maxCertification: (s.maxCertification ?? null) as SurveyData["maxCertification"],
        wildCard: s.wildCard,
      };
    });

  if (surveys.length === 0) throw new Error("No survey responses found");

  return {
    surveys,
    watchedMovieIds,
    candidateIds: room.candidates.map((c) => c.tmdbMovieId),
    mode: (room.mode === "SHORTLIST" ? "SHORTLIST" : "DISCOVER"),
    roomId: room.id,
  };
}

export async function runEngine(
  inputs: RecommendInputs,
  excludeMovieIds: Set<number>,
  count: number
) {
  return inputs.mode === "SHORTLIST"
    ? await getShortlistRecommendations(
        inputs.surveys,
        inputs.candidateIds,
        inputs.watchedMovieIds,
        { excludeMovieIds, count }
      )
    : await getRecommendations(inputs.surveys, inputs.watchedMovieIds, {
        excludeMovieIds,
        count,
      });
}

export interface RecommendationDTO {
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  overview: string | null;
  matchScore: number;
  explanation: string;
  rank: number;
  voteAverage: number | null;
  releaseDate: string | null;
  genreIds: number[];
}

export function recsFromEngine(
  results: Awaited<ReturnType<typeof runEngine>>
): RecommendationDTO[] {
  return results.map((r) => ({
    tmdbMovieId: r.movie.id,
    title: r.movie.title,
    posterPath: r.movie.poster_path,
    overview: r.movie.overview,
    matchScore: r.matchScore,
    explanation: r.explanation,
    rank: r.rank,
    voteAverage: r.movie.vote_average,
    releaseDate: r.movie.release_date,
    genreIds: r.movie.genre_ids,
  }));
}
