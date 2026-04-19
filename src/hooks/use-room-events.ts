"use client";

import { useEffect, useState, useCallback } from "react";
import type { RoomStatus, Participant } from "@/types/room";

interface RoomState {
  status: RoomStatus;
  participants: Participant[];
}

export function useRoomEvents(roomCode: string) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [recommendationsReady, setRecommendationsReady] = useState(false);

  const refresh = useCallback(() => {
    // Force a refetch by briefly disconnecting
    setConnected(false);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource(`/api/rooms/${roomCode}/events`);

    eventSource.addEventListener("connected", () => {
      setConnected(true);
    });

    eventSource.addEventListener("room-update", (e) => {
      try {
        const data = JSON.parse(e.data);
        setRoomState(data);
        setConnected(true);
      } catch {
        // Ignore parse errors
      }
    });

    eventSource.addEventListener("recommendations-ready", () => {
      setRecommendationsReady(true);
    });

    eventSource.addEventListener("error", () => {
      setConnected(false);
    });

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [roomCode]);

  return {
    roomState,
    connected,
    recommendationsReady,
    refresh,
  };
}
