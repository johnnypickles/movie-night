import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// GET: Fetch watch history
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const history = await prisma.watchHistory.findMany({
    where: { userId: user.id },
    orderBy: { watchedAt: "desc" },
    take: 50,
  });

  // Also fetch ratings for these movies
  const ratings = await prisma.movieRating.findMany({
    where: { userId: user.id },
  });

  const ratingMap = new Map(ratings.map((r) => [r.tmdbMovieId, r]));

  const items = history.map((h) => ({
    ...h,
    rating: ratingMap.get(h.tmdbMovieId) ?? null,
  }));

  return NextResponse.json({ history: items });
}

// POST: Add to watch history
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await request.json();
  const { tmdbMovieId, title, posterPath, roomId } = body;

  if (!tmdbMovieId || !title) {
    return NextResponse.json(
      { error: "Movie ID and title are required" },
      { status: 400 }
    );
  }

  const entry = await prisma.watchHistory.upsert({
    where: {
      userId_tmdbMovieId: {
        userId: user.id,
        tmdbMovieId: tmdbMovieId,
      },
    },
    update: { watchedAt: new Date() },
    create: {
      userId: user.id,
      tmdbMovieId,
      title,
      posterPath: posterPath ?? null,
      roomId: roomId ?? null,
    },
  });

  return NextResponse.json({ entry });
}
