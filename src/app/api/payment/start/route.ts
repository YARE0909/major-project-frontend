import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

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

type JourneyWithLegs = {
  id: string;
  status: string;
  legs: Array<{
    mode: string;
    source: string;
    destination: string;
    cost: number;
  }>;
};

const calculateJourneyBreakdown = (journey: JourneyWithLegs): Prisma.InputJsonValue => {
  const legs = journey.legs.map((leg) => ({
    mode: leg.mode,
    from: leg.source,
    to: leg.destination,
    fare: leg.cost,
  }));

  const legsTotal = legs.reduce((sum, l) => sum + (l.fare ?? 0), 0);
  const platformFee = 20;
  const taxes = Math.round(legsTotal * 0.05);
  const total = legsTotal + platformFee + taxes;

  return {
    legs,
    platformFee,
    taxes,
    total,
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { journeyId } = body;

    if (!journeyId) {
      return NextResponse.json(
        { error: "journeyId required" },
        { status: 400 }
      );
    }

    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: { legs: true },
    });

    if (!journey) {
      return NextResponse.json(
        { error: "Journey not found" },
        { status: 404 }
      );
    }

    if (journey.status !== "PLANNED") {
      return NextResponse.json(
        { error: "Journey already paid or invalid" },
        { status: 400 }
      );
    }

    const breakdown = calculateJourneyBreakdown(journey);

    const payment = await prisma.payment.create({
      data: {
        journeyId,
        amount: (breakdown as any).total,
        provider: "MOCK",
        breakdown,
      },
    });

    return NextResponse.json(payment);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to start payment" },
      { status: 500 }
    );
  }
}