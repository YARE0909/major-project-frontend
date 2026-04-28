import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

type JwtPayloadWithUserId = {
  userId: string;
  iat?: number;
  exp?: number;
};

async function getUserIdFromRequest(req: NextRequest) {
  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId) return headerUserId;

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayloadWithUserId;
    return payload.userId || null;
  } catch {
    return null;
  }
}

export const createJourneyFromRouteService = async (
  userId: string,
  selectedRoute: any
) => {
  const { legs, totalCost, totalTime } = selectedRoute;

  const journey = await prisma.journey.create({
    data: {
      userId,
      status: "PLANNED",
      totalCost,
      totalTime,
      legs: {
        create: legs.map((leg: any, idx: number) => ({
          mode: leg.mode,
          source: leg.source,
          destination: leg.destination,
          duration: leg.duration,
          cost: leg.cost,
          order: idx + 1,
        })),
      },
    },
  });

  return journey;
};

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { selectedRoute } = body;

    if (!selectedRoute) {
      return NextResponse.json(
        { error: "selectedRoute required" },
        { status: 400 }
      );
    }

    const journey = await createJourneyFromRouteService(userId, selectedRoute);

    return NextResponse.json({ journeyId: journey.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create journey" },
      { status: 500 }
    );
  }
}