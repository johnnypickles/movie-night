import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Find the room and participant
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const participant = await prisma.roomParticipant.findFirst({
      where: {
        roomId: room.id,
        userId: participantId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found in this room" },
        { status: 404 }
      );
    }

    if (participant.surveyCompleted) {
      return NextResponse.json(
        { error: "Survey already submitted" },
        { status: 400 }
      );
    }

    // Save survey response
    await prisma.surveyResponse.create({
      data: {
        participantId: participant.id,
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
        wildCard: surveyData.wildCard ?? null,
      },
    });

    // Mark participant as survey completed
    await prisma.roomParticipant.update({
      where: { id: participant.id },
      data: { surveyCompleted: true },
    });

    // Update room status to SURVEYING if it was WAITING
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
