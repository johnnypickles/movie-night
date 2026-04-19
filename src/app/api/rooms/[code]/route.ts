import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        participants: {
          select: {
            id: true,
            guestName: true,
            surveyCompleted: true,
            userId: true,
            user: {
              select: { name: true, image: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        recommendations: {
          orderBy: { rank: "asc" },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.expiresAt < new Date()) {
      return NextResponse.json({ error: "Room has expired" }, { status: 410 });
    }

    return NextResponse.json({
      id: room.id,
      code: room.code,
      status: room.status,
      name: room.name,
      hostId: room.hostId,
      createdAt: room.createdAt.toISOString(),
      participants: room.participants.map((p) => ({
        id: p.id,
        name: p.user?.name ?? p.guestName ?? "Guest",
        avatar: p.user?.image ?? null,
        surveyCompleted: p.surveyCompleted,
        userId: p.userId,
      })),
      recommendations: room.recommendations,
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}
