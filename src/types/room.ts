export type RoomStatus =
  | "WAITING"
  | "SURVEYING"
  | "PROCESSING"
  | "RESULTS"
  | "DECIDED"
  | "CLOSED";

export interface Participant {
  id: string;
  name: string;
  avatar: string | null;
  surveyCompleted: boolean;
}

export interface RoomData {
  id: string;
  code: string;
  status: RoomStatus;
  name: string | null;
  hostId: string;
  participants: Participant[];
  createdAt: string;
}

export interface RoomEvent {
  type: "room-update" | "recommendations-ready" | "error";
  data: {
    status?: RoomStatus;
    participants?: Participant[];
    message?: string;
  };
}
