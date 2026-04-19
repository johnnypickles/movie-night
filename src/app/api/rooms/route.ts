import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUniqueRoomCode } from "@/lib/room-codes";
import { getCurrentUser, setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostName, roomName, mode, candidates } = body as {
      hostName?: string;
      roomName?: string;
      mode?: "DISCOVER" | "SHORTLIST";
      candidates?: Array<{
        tmdbMovieId: number;
        title: string;
        posterPath?: string | null;
        releaseYear?: number | null;
        voteAverage?: number | null;
        overview?: string | null;
        genreIds?: number[];
      }>;
    };

    if (!hostName || typeof hostName !== "string") {
      return NextResponse.json(
        { error: "Host name is required" },
        { status: 400 }
      );
    }

    const roomMode: "DISCOVER" | "SHORTLIST" =
      mode === "SHORTLIST" ? "SHORTLIST" : "DISCOVER";

    if (roomMode === "SHORTLIST") {
      if (!candidates || candidates.length < 2) {
        return NextResponse.json(
          { error: "Shortlist mode requires at least 2 movies" },
          { status: 400 }
        );
      }
      if (candidates.length > 15) {
        return NextResponse.json(
          { error: "Shortlist mode supports up to 15 movies" },
          { status: 400 }
        );
      }
    }

    // Check if user is already logged in
    let host = await getCurrentUser();

    if (host) {
      // Update name if different
      if (host.name !== hostName.trim()) {
        host = await prisma.user.update({
          where: { id: host.id },
          data: { name: hostName.trim() },
        });
      }
    } else {
      // Create a new user for the host
      host = await prisma.user.create({
        data: {
          name: hostName.trim(),
        },
      });
      // Set session cookie so they stay logged in
      await setSessionCookie(host.id);
    }

    // Generate unique room code
    const code = await generateUniqueRoomCode();

    // Create room with 24h expiry
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const room = await prisma.room.create({
      data: {
        code,
        hostId: host.id,
        name: roomName || null,
        mode: roomMode,
        expiresAt,
        participants: {
          create: {
            userId: host.id,
            guestName: hostName.trim(),
          },
        },
        ...(roomMode === "SHORTLIST" && candidates
          ? {
              candidates: {
                create: candidates.map((c) => ({
                  tmdbMovieId: c.tmdbMovieId,
                  title: c.title,
                  posterPath: c.posterPath ?? null,
                  releaseYear: c.releaseYear ?? null,
                  voteAverage: c.voteAverage ?? null,
                  overview: c.overview ?? null,
                  genreIds: JSON.stringify(c.genreIds ?? []),
                })),
              },
            }
          : {}),
      },
    });

    return NextResponse.json({
      code: room.code,
      id: room.id,
      hostId: host.id,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
