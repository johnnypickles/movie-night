import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// GET /api/users/[id]/ratings — friend-only: returns user + ratings if friends,
// otherwise returns only the user's public identity so a friend-request flow
// can prompt the caller to add them.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetId } = await params;

  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, image: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isSelf = me.id === targetId;
  let isFriend = false;
  if (!isSelf) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: me.id, friendId: targetId },
          { userId: targetId, friendId: me.id },
        ],
      },
    });
    isFriend = Boolean(friendship);
  }

  if (!isFriend && !isSelf) {
    return NextResponse.json({ user, isFriend: false, ratings: [] });
  }

  const [ratings, history] = await Promise.all([
    prisma.movieRating.findMany({
      where: { userId: targetId },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.watchHistory.findMany({
      where: { userId: targetId },
      select: { tmdbMovieId: true, title: true, posterPath: true },
    }),
  ]);

  const historyMap = new Map(history.map((h) => [h.tmdbMovieId, h]));
  const enriched = ratings.map((r) => {
    const h = historyMap.get(r.tmdbMovieId);
    return {
      tmdbMovieId: r.tmdbMovieId,
      rating: r.rating,
      comment: r.comment,
      updatedAt: r.updatedAt,
      title: h?.title ?? null,
      posterPath: h?.posterPath ?? null,
    };
  });

  return NextResponse.json({
    user,
    isFriend: true,
    isSelf,
    ratings: enriched,
  });
}
