import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// GET: List friends
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Get both directions of friendship
  const [friendsOf, friendsTo] = await Promise.all([
    prisma.friendship.findMany({
      where: { userId: user.id },
      include: {
        friend: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { friendId: user.id },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    }),
  ]);

  const friends = [
    ...friendsOf.map((f) => ({
      friendshipId: f.id,
      ...f.friend,
      since: f.createdAt,
    })),
    ...friendsTo.map((f) => ({
      friendshipId: f.id,
      ...f.user,
      since: f.createdAt,
    })),
  ];

  // Deduplicate
  const seen = new Set<string>();
  const uniqueFriends = friends.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });

  return NextResponse.json({ friends: uniqueFriends });
}

// POST: Add friend by name (search for users)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await request.json();
  const { friendId } = body;

  if (!friendId) {
    return NextResponse.json(
      { error: "Friend ID is required" },
      { status: 400 }
    );
  }

  if (friendId === user.id) {
    return NextResponse.json(
      { error: "You can't add yourself as a friend" },
      { status: 400 }
    );
  }

  // Check friend exists
  const friend = await prisma.user.findUnique({ where: { id: friendId } });
  if (!friend) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if already friends
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: user.id, friendId },
        { userId: friendId, friendId: user.id },
      ],
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Already friends" },
      { status: 400 }
    );
  }

  const friendship = await prisma.friendship.create({
    data: { userId: user.id, friendId },
  });

  return NextResponse.json({ friendship });
}

// DELETE: Remove friend
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await request.json();
  const { friendshipId } = body;

  if (!friendshipId) {
    return NextResponse.json(
      { error: "Friendship ID is required" },
      { status: 400 }
    );
  }

  // Only delete if user is part of this friendship
  const friendship = await prisma.friendship.findFirst({
    where: {
      id: friendshipId,
      OR: [{ userId: user.id }, { friendId: user.id }],
    },
  });

  if (!friendship) {
    return NextResponse.json(
      { error: "Friendship not found" },
      { status: 404 }
    );
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });
  return NextResponse.json({ success: true });
}
