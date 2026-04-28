import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AccessibilityBody = {
  wheelchair?: boolean;
  blind?: boolean;
  deaf?: boolean;
  cognitive?: boolean;
  fatigue?: boolean;
};

async function getUserIdFromRequest(req: NextRequest) {
  // Replace this with your real auth logic:
  // - NextAuth session
  // - JWT verification
  // - Clerk/Auth0/etc.
  //
  // Example fallback if you pass it from middleware:
  const userId = req.headers.get("x-user-id");
  return userId;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.userAccessibilityProfile.findUnique({
      where: { userId },
    });

    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as AccessibilityBody;

    const profile = await prisma.userAccessibilityProfile.upsert({
      where: { userId },
      update: {
        wheelchair: !!body.wheelchair,
        blind: !!body.blind,
        deaf: !!body.deaf,
        cognitive: !!body.cognitive,
        fatigue: !!body.fatigue,
      },
      create: {
        userId,
        wheelchair: !!body.wheelchair,
        blind: !!body.blind,
        deaf: !!body.deaf,
        cognitive: !!body.cognitive,
        fatigue: !!body.fatigue,
      },
    });

    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save profile" },
      { status: 500 }
    );
  }
}