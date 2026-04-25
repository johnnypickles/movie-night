import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: fetch a participant's existing survey response (for editing)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const participantId = request.nextUrl.searchParams.get("participantId");
  if (!participantId) {
    return NextResponse.json(
      { error: "participantId required" },
      { status: 400 }
    );
  }

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const participant = await prisma.roomParticipant.findFirst({
    where: { roomId: room.id, userId: participantId },
    include: { surveyResponse: true },
  });

  if (!participant) {
    return NextResponse.json({ response: null });
  }

  const s = participant.surveyResponse;
  if (!s) {
    return NextResponse.json({ response: null });
  }

  return NextResponse.json({
    response: {
      mood: s.mood,
      vibeWords: JSON.parse(s.vibeWords),
      genreLikes: JSON.parse(s.genreLikes),
      genreDislikes: JSON.parse(s.genreDislikes),
      decadeMin: s.decadeMin,
      decadeMax: s.decadeMax,
      maxRuntime: s.maxRuntime,
      minRating: s.minRating,
      favoriteMovieIds: JSON.parse(s.favoriteMovieIds),
      noSubtitles: s.noSubtitles,
      noBlackWhite: s.noBlackWhite,
      noAnimation: s.noAnimation,
      noHorror: s.noHorror,
      maxCertification: s.maxCertification,
      streamingProviders: JSON.parse(s.streamingProviders || "[]"),
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const body = await request.json();
    const { participantId, surveyData } = body;

    if (!participantId || !surveyData) {
      return NextResponse.json(
        { error: "Participant ID and survey data are required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const participant = await prisma.roomParticipant.findFirst({
      where: { roomId: room.id, userId: participantId },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found in this room" },
        { status: 404 }
      );
    }

    const data = {
      roomId: room.id,
      mood: surveyData.mood,
      vibeWords: JSON.stringify(surveyData.vibeWords || []),
      genreLikes: JSON.stringify(surveyData.genreLikes || []),
      genreDislikes: JSON.stringify(surveyData.genreDislikes || []),
      decadeMin: surveyData.decadeMin ?? null,
      decadeMax: surveyData.decadeMax ?? null,
      maxRuntime: surveyData.maxRuntime ?? null,
      minRating: surveyData.minRating ?? null,
      favoriteMovieIds: JSON.stringify(surveyData.favoriteMovieIds || []),
      noSubtitles: surveyData.noSubtitles ?? false,
      noBlackWhite: surveyData.noBlackWhite ?? false,
      noAnimation: surveyData.noAnimation ?? false,
      noHorror: surveyData.noHorror ?? false,
      maxCertification: surveyData.maxCertification ?? null,
      streamingProviders: JSON.stringify(surveyData.streamingProviders || []),
      wildCard: surveyData.wildCard ?? null,
    };

    // Upsert: create on first submit, update on edit.
    await prisma.surveyResponse.upsert({
      where: { participantId: participant.id },
      create: { participantId: participant.id, ...data },
      update: data,
    });

    await prisma.roomParticipant.update({
      where: { id: participant.id },
      data: { surveyCompleted: true },
    });

    if (room.status === "WAITING") {
      await prisma.room.update({
        where: { id: room.id },
        data: { status: "SURVEYING" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting survey:", error);
    return NextResponse.json(
      { error: "Failed to submit survey" },
      { status: 500 }
    );
  }
}
