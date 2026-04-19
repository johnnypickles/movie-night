import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, setSessionCookie, clearSessionCookie } from "@/lib/session";

// GET: Check current session
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user });
}

// POST: Create session (login with name)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, userId } = body;

  // If userId provided, resume existing session
  if (userId) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing) {
      await setSessionCookie(existing.id);
      return NextResponse.json({ user: existing });
    }
  }

  // Create new user with name
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: { name: name.trim() },
  });

  await setSessionCookie(user.id);
  return NextResponse.json({ user });
}

// DELETE: Logout
export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
