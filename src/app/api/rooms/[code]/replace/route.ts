import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  loadRecommendInputs,
  runEngine,
  recsFromEngine,
} from "@/lib/recommend-helpers";

// POST /api/rooms/[code]/replace
// Body: { tmdbMovieId: number }
// Replaces the given recommendation with the next-best compatible movie.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const { tmdbMovieId } = await request.json();
    if (!tmdbMovieId) {
      return NextResponse.json(
        { error: "tmdbMovieId required" },
        { status: 400 }
      );
    }

    const inputs = await loadRecommendInputs(code);

    const existing = await prisma.recommendation.findMany({
      where: { roomId: inputs.roomId },
      orderBy: { rank: "asc" },
    });
    const target = existing.find((r) => r.tmdbMovieId === tmdbMovieId);
    if (!target) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 }
      );
    }

    // Exclude all currently shown movies (they shouldn't reappear).
    const exclude = new Set<number>(existing.map((r) => r.tmdbMovieId));

    const fresh = await runEngine(inputs, exclude, 1);
    if (fresh.length === 0) {
      return NextResponse.json(
        { error: "No more compatible movies to swap in" },
        { status: 404 }
      );
    }

    const replacement = fresh[0];
    const releaseYear = replacement.movie.release_date
      ? parseInt(replacement.movie.release_date.slice(0, 4), 10)
      : null;

    // Replace the row at the same rank — delete then create
    // (rank is part of a unique constraint with roomId).
    await prisma.$transaction([
      prisma.recommendation.delete({ where: { id: target.id } }),
      prisma.recommendation.create({
        data: {
          roomId: inputs.roomId,
          tmdbMovieId: replacement.movie.id,
          title: replacement.movie.title,
          posterPath: replacement.movie.poster_path,
          overview: replacement.movie.overview,
          matchScore: replacement.matchScore,
          explanation: replacement.explanation,
          rank: target.rank,
          genreIds: JSON.stringify(replacement.movie.genre_ids),
          releaseYear,
          runtime: null,
          voteAverage: replacement.movie.vote_average,
        },
      }),
    ]);

    const dto = recsFromEngine([replacement])[0];
    // Override engine rank with the slot we replaced
    dto.rank = target.rank;
    return NextResponse.json({ recommendation: dto });
  } catch (err) {
    console.error("replace error:", err);
    const msg = err instanceof Error ? err.message : "Replace failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
