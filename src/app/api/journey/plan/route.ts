import { NextRequest, NextResponse } from "next/server";

export type UserAccessibilityProfileShape = {
  wheelchair?: boolean;
  blind?: boolean;
  deaf?: boolean;
  cognitive?: boolean;
  fatigue?: boolean;
};

type RawLeg = {
  mode: string;
  fromCoords: { lat: number; lon: number; displayName?: string };
  toCoords: { lat: number; lon: number; displayName?: string };
  duration: number;
  cost: number;
  source: string;
  destination: string;
};

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

const BASE_MODE_RISK: Record<string, number> = {
  WALK: 0.02,
  AUTO: 0.06,
  METRO: 0.03,
  BUS: 0.08,
  TRAIN: 0.04,
  CAB: 0.06,
};

function computeLegAccessibilityScore(
  leg: RawLeg,
  profile: UserAccessibilityProfileShape | null
) {
  let score = 100;
  const issues: string[] = [];

  const dur = leg.duration ?? 0;
  const mode = (leg.mode || "WALK").toUpperCase();

  if (mode === "WALK") {
    if (dur >= 20) {
      score -= 30;
      issues.push("very_long_walk");
    } else if (dur >= 10) {
      score -= 15;
      issues.push("long_walk");
    }
  }

  if (mode === "AUTO" || mode === "CAB") {
    score -= 5;
    issues.push("vehicle_step_entry");
  }

  if (mode === "METRO" || mode === "TRAIN") {
    score -= 8;
    issues.push("station_navigation_required");
  }

  if (dur >= 40) {
    score -= 10;
    issues.push("very_long_leg");
  }

  if (profile?.wheelchair) {
    if (mode === "WALK") {
      if (dur >= 20) {
        score -= 40;
        issues.push("long_walk_for_wheelchair");
      } else if (dur >= 10) {
        score -= 20;
        issues.push("moderate_walk_for_wheelchair");
      }
    }

    if (mode === "METRO" || mode === "TRAIN") {
      score -= 15;
      issues.push("elevator_uncertain");
    }
  }

  if (profile?.blind) {
    if (mode === "WALK" && dur >= 15) {
      score -= 15;
      issues.push("long_walk_for_lowvision");
    }

    score -= 5;
    issues.push("limited_audio_guidance");
  }

  if (profile?.deaf) {
    score -= 5;
    issues.push("visual_alerts_uncertain");
  }

  if (profile?.cognitive) {
    if (dur >= 10) {
      score -= 10;
      issues.push("complex_leg_duration");
    }
  }

  if (profile?.fatigue) {
    if (mode === "WALK") {
      if (dur >= 20) {
        score -= 40;
        issues.push("excessive_walking_for_fatigue");
      } else if (dur >= 10) {
        score -= 20;
        issues.push("long_walk_for_fatigue");
      }
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, issues };
}

function computeLegFailureProbability(
  leg: RawLeg,
  accessibilityScore: number
): number {
  const mode = (leg.mode || "WALK").toUpperCase();
  const baseModeRisk = BASE_MODE_RISK[mode] ?? 0.06;
  const accessFactor = 1 - accessibilityScore / 100;
  const weightAccessibility = 0.6;
  const rawRisk = baseModeRisk + accessFactor * weightAccessibility;
  return clamp01(rawRisk);
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

export async function getRoadRoute(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;

  const res = await fetch(url);
  const data = await res.json();

  const route = data.routes[0];

  return {
    duration: Math.round(route.duration / 60),
    distance: route.distance / 1000,
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

export const planJourneyService = async (
  source: string,
  destination: string,
  userAccessibilityProfile: UserAccessibilityProfileShape | null = null
) => {
  const from = await geocode(source);
  const to = await geocode(destination);

  const auto = await getRoadRoute(from, to);

  const makeLeg = (
    mode: string,
    duration: number,
    cost: number,
    fromCoords = from,
    toCoords = to
  ) => ({
    mode,
    source,
    destination,
    fromCoords,
    toCoords,
    duration,
    cost,
  });

  const rawRoutes: {
    id: string;
    name: string;
    source: string;
    destination: string;
    legs: RawLeg[];
    totalTime: number;
    totalCost: number;
  }[] = [];

  rawRoutes.push({
    id: "auto-direct",
    name: "Auto direct",
    source,
    destination,
    legs: [makeLeg("AUTO", auto.duration, Math.round(auto.distance * 18))],
    totalTime: auto.duration,
    totalCost: Math.round(auto.distance * 18),
  });

  rawRoutes.push({
    id: "walk-auto",
    name: "Walk + Auto",
    source,
    destination,
    legs: [
      makeLeg("WALK", Math.round(auto.duration * 0.3), 0),
      makeLeg("AUTO", Math.round(auto.duration * 0.7), Math.round(auto.distance * 15)),
    ],
    totalTime: auto.duration,
    totalCost: Math.round(auto.distance * 15),
  });

  rawRoutes.push({
    id: "metro-auto",
    name: "Metro + Auto",
    source,
    destination,
    legs: [
      makeLeg("METRO", Math.round(auto.duration * 0.6), 50),
      makeLeg("AUTO", Math.round(auto.duration * 0.4), 150),
    ],
    totalTime: auto.duration,
    totalCost: 200,
  });

  const routes = [];

  for (const r of rawRoutes) {
    const legsWithMeta = [];
    const legFailureProbs: number[] = [];

    for (const leg of r.legs) {
      const { score, issues } = computeLegAccessibilityScore(
        leg,
        userAccessibilityProfile
      );

      const legFailure = computeLegFailureProbability(leg, score);

      legsWithMeta.push({
        ...leg,
        accessibility: {
          score,
          issues,
        },
        failureProbability: Number(legFailure.toFixed(4)),
      });

      legFailureProbs.push(legFailure);
    }

    let prod = 1;
    for (const p of legFailureProbs) prod *= 1 - p;
    const routeFailure = clamp01(1 - prod);

    routes.push({
      id: r.id,
      name: r.name,
      source: r.source,
      destination: r.destination,
      legs: legsWithMeta,
      totalTime: r.totalTime,
      totalCost: r.totalCost,
      failureProbability: Number(routeFailure.toFixed(4)),
    });
  }

  return routes;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, destination, accessibility } = body;

    if (!source || !destination) {
      return NextResponse.json(
        { error: "source and destination required" },
        { status: 400 }
      );
    }

    const routes = await planJourneyService(
      source,
      destination,
      accessibility ?? null
    );

    return NextResponse.json({ routes });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to plan journey" },
      { status: 500 }
    );
  }
}