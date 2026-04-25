import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  loadRecommendInputs,
  runEngine,
  recsFromEngine,
} from "@/lib/recommend-helpers";

// POST /api/rooms/[code]/regenerate
// Re-runs the algorithm but excludes all currently shown recommendations,
// returning a fresh top-5.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const inputs = await loadRecommendInputs(code);

    const existing = await prisma.recommendation.findMany({
      where: { roomId: inputs.roomId },
      orderBy: { rank: "asc" },
    });
    const exclude = new Set<number>(existing.map((r) => r.tmdbMovieId));

    const fresh = await runEngine(inputs, exclude, 5);
    if (fresh.length === 0) {
      return NextResponse.json(
        { error: "No more compatible movies to recommend" },
        { status: 404 }
      );
    }

    // Replace all existing recs in one transaction.
    const ops = [
      prisma.recommendation.deleteMany({ where: { roomId: inputs.roomId } }),
      ...fresh.map((r) => {
        const releaseYear = r.movie.release_date
          ? parseInt(r.movie.release_date.slice(0, 4), 10)
          : null;
        return prisma.recommendation.create({
          data: {
            roomId: inputs.roomId,
            tmdbMovieId: r.movie.id,
            title: r.movie.title,
            posterPath: r.movie.poster_path,
            overview: r.movie.overview,
            matchScore: r.matchScore,
            explanation: r.explanation,
            rank: r.rank,
            genreIds: JSON.stringify(r.movie.genre_ids),
            releaseYear,
            runtime: null,
            voteAverage: r.movie.vote_average,
          },
        });
      }),
    ];
    await prisma.$transaction(ops);

    return NextResponse.json({ recommendations: recsFromEngine(fresh) });
  } catch (err) {
    console.error("regenerate error:", err);
    const msg = err instanceof Error ? err.message : "Regenerate failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
