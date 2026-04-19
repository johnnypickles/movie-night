import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// GET: Fetch user's ratings
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const ratings = await prisma.movieRating.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ ratings });
}

// POST: Rate a movie
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await request.json();
  const { tmdbMovieId, rating, comment } = body;

  if (!tmdbMovieId || typeof rating !== "number" || rating < 1 || rating > 10) {
    return NextResponse.json(
      { error: "Valid movie ID and rating (1-10) are required" },
      { status: 400 }
    );
  }

  const movieRating = await prisma.movieRating.upsert({
    where: {
      userId_tmdbMovieId: {
        userId: user.id,
        tmdbMovieId,
      },
    },
    update: {
      rating,
      comment: comment ?? null,
    },
    create: {
      userId: user.id,
      tmdbMovieId,
      rating,
      comment: comment ?? null,
    },
  });

  return NextResponse.json({ rating: movieRating });
}
