import { prisma } from "./prisma";

const PREFIXES = ["MOVIE", "FILM", "FLICK", "REEL", "SCENE", "SHOW"];
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous I/1/O/0

function generateCode(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `${prefix}-${suffix}`;
}

export async function generateUniqueRoomCode(): Promise<string> {
  let code: string;
  let attempts = 0;

  do {
    code = generateCode();
    const existing = await prisma.room.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
    attempts++;
  } while (attempts < 10);

  // Extremely unlikely fallback: add extra characters
  return `${generateCode()}${CHARS[Math.floor(Math.random() * CHARS.length)]}`;
}
