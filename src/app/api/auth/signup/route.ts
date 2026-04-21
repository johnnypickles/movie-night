import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, setSessionCookie } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    const passwordHash = await bcrypt.hash(password, 10);

    // If the caller is currently logged in as a guest (no email), upgrade that user.
    const current = await getCurrentUser();
    if (current && !current.email) {
      if (existing && existing.id !== current.id) {
        return NextResponse.json(
          { error: "That email is already in use" },
          { status: 409 }
        );
      }
      const upgraded = await prisma.user.update({
        where: { id: current.id },
        data: {
          email: trimmedEmail,
          passwordHash,
          name: trimmedName || current.name,
        },
      });
      await setSessionCookie(upgraded.id);
      return NextResponse.json({ user: stripSecrets(upgraded) });
    }

    if (existing) {
      return NextResponse.json(
        { error: "That email is already in use" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        passwordHash,
        name: trimmedName || trimmedEmail.split("@")[0],
      },
    });

    await setSessionCookie(user.id);
    return NextResponse.json({ user: stripSecrets(user) });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}

function stripSecrets<T extends { passwordHash?: string | null }>(user: T) {
  const { passwordHash: _p, ...rest } = user;
  void _p;
  return rest;
}
