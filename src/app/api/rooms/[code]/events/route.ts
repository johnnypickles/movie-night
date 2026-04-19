import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const roomCode = code.toUpperCase();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Controller may be closed
        }
      };

      // Send initial keepalive
      sendEvent("connected", { message: "Connected to room events" });

      // Poll for room updates every 2 seconds
      const interval = setInterval(async () => {
        try {
          const room = await prisma.room.findUnique({
            where: { code: roomCode },
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
            },
          });

          if (!room) {
            sendEvent("error", { message: "Room not found" });
            clearInterval(interval);
            controller.close();
            return;
          }

          sendEvent("room-update", {
            status: room.status,
            participants: room.participants.map((p) => ({
              id: p.id,
              name: p.user?.name ?? p.guestName ?? "Guest",
              avatar: p.user?.image ?? null,
              surveyCompleted: p.surveyCompleted,
              userId: p.userId,
            })),
          });

          if (room.status === "RESULTS" || room.status === "DECIDED") {
            sendEvent("recommendations-ready", { roomId: room.id });
          }

          if (room.status === "CLOSED" || room.expiresAt < new Date()) {
            sendEvent("room-closed", { message: "Room has been closed" });
            clearInterval(interval);
            controller.close();
          }
        } catch {
          // Transient errors are okay - keep polling
        }
      }, 2000);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
