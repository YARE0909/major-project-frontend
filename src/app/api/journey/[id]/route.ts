import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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

export async function geocode(place: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      place
    )}&format=json&limit=1`,
    {
      headers: {
        "User-Agent": "NextJS-Journey-App/1.0",
      },
    }
  );

  const data = await res.json();

  if (!data.length) throw new Error("Location not found");

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

export default async function hydrateLegCoords(legs: any[]) {
  return Promise.all(
    legs.map(async (leg) => {
      const from = await geocode(leg.source);
      const to = await geocode(leg.destination);

      return {
        ...leg,
        fromCoords: from,
        toCoords: to,
      };
    })
  );
}

export const getJourneyByIdService = async (journeyId: string) => {
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    include: {
      legs: {
        orderBy: { order: "asc" },
        include: {
          travelPass: true,
          ticket: true,
        },
      },
      booking: true,
    },
  });

  if (!journey) return null;

  const hydratedLegs = await hydrateLegCoords(journey.legs);

  return {
    ...journey,
    legs: hydratedLegs,
  };
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const journey = await getJourneyByIdService(id);

    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    return NextResponse.json({ journey });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch journey" },
      { status: 500 }
    );
  }
}