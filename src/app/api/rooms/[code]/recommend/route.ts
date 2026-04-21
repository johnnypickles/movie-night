import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRecommendations, getShortlistRecommendations } from "@/lib/recommendation-engine";
import type { SurveyData } from "@/types/survey";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        participants: {
          include: {
            surveyResponse: true,
          },
        },
        candidates: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check all participants have completed surveys
    const incomplete = room.participants.filter((p) => !p.surveyCompleted);
    if (incomplete.length > 0) {
      return NextResponse.json(
        {
          error: `${incomplete.length} participant(s) haven't completed the survey yet`,
        },
        { status: 400 }
      );
    }

    // Update status to PROCESSING
    await prisma.room.update({
      where: { id: room.id },
      data: { status: "PROCESSING" },
    });

    // Pull logged-in participants' ratings + watch history to enrich the survey signal.
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

    // Build per-user lookup maps
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

    // Watched movies across all participants — excluded from discover pool.
    const watchedMovieIds = new Set<number>(watched.map((w) => w.tmdbMovieId));

    // Parse survey responses, merging in each user's top-rated movies as bonus favorites.
    const surveys: SurveyData[] = room.participants
      .filter((p) => p.surveyResponse)
      .map((p) => {
        const s = p.surveyResponse!;
        const surveyFavs: number[] = JSON.parse(s.favoriteMovieIds);
        const extraFavs = p.userId ? (userTopRated.get(p.userId) ?? []) : [];
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

    if (surveys.length === 0) {
      return NextResponse.json(
        { error: "No survey responses found" },
        { status: 400 }
      );
    }

    // Flatten all disliked movies across the group — will be excluded from results.
    const groupDisliked = new Set<number>();
    for (const set of userDisliked.values()) {
      for (const id of set) groupDisliked.add(id);
    }
    for (const id of groupDisliked) watchedMovieIds.add(id);

    // Run recommendation engine (discover or shortlist)
    const results =
      room.mode === "SHORTLIST"
        ? await getShortlistRecommendations(
            surveys,
            room.candidates.map((c) => c.tmdbMovieId),
            watchedMovieIds
          )
        : await getRecommendations(surveys, watchedMovieIds);

    if (results.length === 0) {
      await prisma.room.update({
        where: { id: room.id },
        data: { status: "SURVEYING" },
      });
      return NextResponse.json(
        { error: "Could not find matching movies. Try broadening your preferences!" },
        { status: 404 }
      );
    }

    // Delete any existing recommendations for this room
    await prisma.recommendation.deleteMany({
      where: { roomId: room.id },
    });

    // Save recommendations
    for (const result of results) {
      const releaseYear = result.movie.release_date
        ? parseInt(result.movie.release_date.slice(0, 4), 10)
        : null;

      await prisma.recommendation.create({
        data: {
          roomId: room.id,
          tmdbMovieId: result.movie.id,
          title: result.movie.title,
          posterPath: result.movie.poster_path,
          overview: result.movie.overview,
          matchScore: result.matchScore,
          explanation: result.explanation,
          rank: result.rank,
          genreIds: JSON.stringify(result.movie.genre_ids),
          releaseYear,
          runtime: null, // Would need extra API call
          voteAverage: result.movie.vote_average,
        },
      });
    }

    // Update room status to RESULTS
    await prisma.room.update({
      where: { id: room.id },
      data: { status: "RESULTS" },
    });

    return NextResponse.json({
      success: true,
      recommendations: results.map((r) => ({
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
      })),
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    // Reset room status on error
    try {
      const room = await prisma.room.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (room) {
        await prisma.room.update({
          where: { id: room.id },
          data: { status: "SURVEYING" },
        });
      }
    } catch {
      // Ignore cleanup errors
    }
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
