import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordReset } from "@/lib/email";

// 1 hour reset window
const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalized = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalized } });

    // Always respond ok: do not leak whether an account exists.
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Generate a random token, store only its hash; send the raw token by email.
    const raw = crypto.randomBytes(32).toString("base64url");
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const origin =
      request.headers.get("origin") ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(raw)}`;

    try {
      await sendPasswordReset(normalized, resetUrl);
    } catch (err) {
      console.error("[forgot-password] send failed:", err);
      // Still respond ok to avoid leaking info. The user can try again.
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
