import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// PATCH /api/users/me — update own name and/or image (avatar URL).
export async function PATCH(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { name, image } = await request.json();

  const data: { name?: string; image?: string | null } = {};
  if (typeof name === "string") {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 40) {
      return NextResponse.json(
        { error: "Name must be 1–40 characters" },
        { status: 400 }
      );
    }
    data.name = trimmed;
  }
  if (image === null || typeof image === "string") {
    if (typeof image === "string" && image.length > 0) {
      // Basic validation: must be a valid URL or a data: URI under 2MB.
      const MAX_DATA_URI = 2 * 1024 * 1024;
      if (image.startsWith("data:image/")) {
        if (image.length > MAX_DATA_URI) {
          return NextResponse.json(
            { error: "Image too large (max 2MB)" },
            { status: 400 }
          );
        }
      } else {
        try {
          new URL(image);
        } catch {
          return NextResponse.json(
            { error: "Image must be a valid URL or uploaded image" },
            { status: 400 }
          );
        }
      }
    }
    data.image = image || null;
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: updated });
}
