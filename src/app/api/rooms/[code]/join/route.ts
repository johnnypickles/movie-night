import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, setSessionCookie } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const body = await request.json();
    const { guestName } = body;

    if (!guestName || typeof guestName !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: { participants: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.expiresAt < new Date()) {
      return NextResponse.json({ error: "Room has expired" }, { status: 410 });
    }

    if (room.status === "CLOSED") {
      return NextResponse.json(
        { error: "Room is closed" },
        { status: 400 }
      );
    }

    if (room.participants.length >= room.maxSize) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }

    // Check if user is already logged in
    let user = await getCurrentUser();

    if (user) {
      // Check if already a participant
      const existingParticipant = room.participants.find(
        (p) => p.userId === user!.id
      );
      if (existingParticipant) {
        return NextResponse.json({
          success: true,
          participantId: user.id,
        });
      }
      // Update name if different
      if (user.name !== guestName.trim()) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: guestName.trim() },
        });
      }
    } else {
      // Create a new guest user
      user = await prisma.user.create({
        data: {
          name: guestName.trim(),
        },
      });
      // Set session cookie so they stay logged in
      await setSessionCookie(user.id);
    }

    // Add participant to room
    await prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: user.id,
        guestName: guestName.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      participantId: user.id,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}
