import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

export const runtime = "nodejs";

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

type RouteAlert = {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
  locationHint: string;
  sourceHint?: string;
};

type AnalyzedLeg = RawLeg & {
  accessibility: {
    score: number;
    issues: string[];
  };
  failureProbability: number;
  notes: string[];
};

type PlannedRoute = {
  id: string;
  name: string;
  source: string;
  destination: string;
  legs: AnalyzedLeg[];
  totalTime: number;
  totalCost: number;
  failureProbability: number;
  overallScore: number;
  rank: number;
  summary: string;
  notes: string[];
  alerts: RouteAlert[];
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
  profile: UserAccessibilityProfileShape | null,
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
  accessibilityScore: number,
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
      place,
    )}&format=json&limit=1`,
    {
      headers: {
        "User-Agent": "TravelNest/1.0",
      },
    },
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
  to: { lat: number; lon: number },
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

const routeAlertSchema = z.object({
  title: z.string(),
  detail: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  locationHint: z.string(),
  sourceHint: z.string().optional(),
});

const routeAnalysisSchema = z.object({
  recommendedRouteId: z.string(),
  disclaimer: z.string(),
  routes: z.array(
    z.object({
      id: z.string(),
      rank: z.number().int().min(1),
      overallScore: z.number().min(0).max(100),
      summary: z.string(),
      notes: z.array(z.string()),
      alerts: z.array(routeAlertSchema),
      legNotes: z
        .array(
          z.object({
            legIndex: z.number().int().min(0),
            note: z.string(),
          }),
        )
        .optional(),
    }),
  ),
});

function localSummary(route: PlannedRoute) {
  const topAlerts = route.alerts.slice(0, 2).map((a) => a.title);
  const noteText =
    topAlerts.length > 0
      ? `Live signals mention ${topAlerts.join(" and ")}.`
      : "No major live disruption notes detected in the fallback analysis.";
  return `${route.name} is a ${route.overallScore}/100 fit for the selected accessibility profile. ${noteText}`;
}

function mergeGeminiAnalysis(
  routes: PlannedRoute[],
  analysis: z.infer<typeof routeAnalysisSchema> | null,
) {
  if (!analysis) {
    return routes.map((route, idx) => ({
      ...route,
      rank: idx + 1,
      summary: localSummary(route),
      notes: [
        `Failure probability: ${(route.failureProbability * 100).toFixed(1)}%.`,
        `Accessibility fit: ${route.overallScore}/100.`,
      ],
    }));
  }

  const byId = new Map(analysis.routes.map((r) => [r.id, r]));

  return routes
    .map((route, idx) => {
      const extra = byId.get(route.id);

      const legNotesByIndex = new Map<number, string[]>();
      extra?.legNotes?.forEach((item) => {
        const arr = legNotesByIndex.get(item.legIndex) ?? [];
        arr.push(item.note);
        legNotesByIndex.set(item.legIndex, arr);
      });

      const legs = route.legs.map((leg, legIndex) => ({
        ...leg,
        notes: [...leg.notes, ...(legNotesByIndex.get(legIndex) ?? [])],
      }));

      return {
        ...route,
        rank: extra?.rank ?? idx + 1,
        overallScore: extra?.overallScore ?? route.overallScore,
        summary: extra?.summary ?? localSummary(route),
        notes: extra?.notes ?? [
          `Failure probability: ${(route.failureProbability * 100).toFixed(1)}%.`,
          `Accessibility fit: ${route.overallScore}/100.`,
        ],
        alerts: extra?.alerts ?? route.alerts,
        legs,
      };
    })
    .sort((a, b) => a.rank - b.rank);
}

async function analyzeRoutesWithGemini(
  source: string,
  destination: string,
  accessibility: UserAccessibilityProfileShape | null,
  routes: PlannedRoute[],
) {
  // const apiKey = process.env.GEMINI_API_KEY;
  const apiKey = "AAIzaSyBtClEovX0EYT9invTIbNgUx_A2EJhYL78";
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing.");
    return null;
  }

  console.log({ apiKey });

  // gemini-2.5-pro is the correct, most capable model for complex reasoning + tools
  const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
  const ai = new GoogleGenAI({ apiKey });

  const now = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "long",
  });

  const prompt = `
You are a highly analytical route logistics and accessibility expert.

CURRENT DATE & TIME: ${now}
REGION: Bengaluru, Karnataka, India

YOUR MISSION:
1. You MUST use the googleSearch tool to find real-time data for the journey from "${source}" to "${destination}".
2. Specifically query for: "Bengaluru traffic today", "Bengaluru weather today", and any specific news, road closures, or transit delays around "${source}" or "${destination}".
3. Analyze the candidate routes against the user's specific accessibility profile.
4. Rank the routes from best (1) to worst based on real-world live risks + accessibility match.

TRIP DETAILS:
- Source: ${source}
- Destination: ${destination}
- User Accessibility Profile: ${JSON.stringify(accessibility ?? {})}

CANDIDATE ROUTES:
${JSON.stringify(routes, null, 2)}

STRICT RULES:
- NO GENERIC ADVICE. You are the local conditions checker. Do not tell the user to "check local traffic".
- Provide SPECIFIC alerts based on the live data you found via Search (e.g., "Heavy waterlogging reported on Outer Ring Road today" or "Clear skies and normal traffic detected").
- Ensure notes explicitly explain how the route impacts the requested accessibility needs.
- Return ONLY pure JSON matching the strict schema.
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedRouteId: {
              type: Type.STRING,
              description: "The ID of the best overall route.",
            },
            disclaimer: {
              type: Type.STRING,
              description:
                "A 1-sentence overview of current live conditions (e.g., 'Heavy rain detected, auto routes are penalized.').",
            },
            routes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  rank: { type: Type.INTEGER }, // Changed to INTEGER to satisfy Zod
                  overallScore: {
                    type: Type.INTEGER, // Changed to INTEGER to satisfy Zod
                    description:
                      "0 to 100 score weighing time, cost, accessibility, and live weather/traffic risks.",
                  },
                  summary: {
                    type: Type.STRING,
                    description:
                      "A 1-2 sentence hyper-specific summary of why this route scored the way it did based on live data.",
                  },
                  notes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description:
                      "Specific bullet points about route conditions and accessibility. No generic fluff.",
                  },
                  alerts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        detail: { type: Type.STRING },
                        severity: {
                          type: Type.STRING,
                          enum: ["low", "medium", "high"],
                        },
                        locationHint: { type: Type.STRING },
                        sourceHint: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 1. Strip out markdown code blocks that break JSON.parse
    let raw = response.text?.trim() || "";
    raw = raw
      .replace(/^```json/i, "")
      .replace(/```$/i, "")
      .trim();

    if (!raw) {
      console.error("Gemini returned an empty response.");
      return null;
    }

    // 2. Parse and Validate
    const parsed = JSON.parse(raw);
    return routeAnalysisSchema.parse(parsed);
  } catch (error) {
    // 3. Log the actual error so you aren't guessing why it failed
    console.error(
      "Failed during Gemini generation, parsing, or validation:",
      error,
    );
    return null;
  }
}

export const planJourneyService = async (
  source: string,
  destination: string,
  userAccessibilityProfile: UserAccessibilityProfileShape | null = null,
) => {
  const from = await geocode(source);
  const to = await geocode(destination);
  const auto = await getRoadRoute(from, to);

  const makeLeg = (
    mode: string,
    duration: number,
    cost: number,
    fromCoords = from,
    toCoords = to,
  ) => ({
    mode,
    source,
    destination,
    fromCoords,
    toCoords,
    duration,
    cost,
  });

  const rawRoutes = [
    {
      id: "auto-direct",
      name: "Auto direct",
      source,
      destination,
      legs: [makeLeg("AUTO", auto.duration, Math.round(auto.distance * 18))],
      totalTime: auto.duration,
      totalCost: Math.round(auto.distance * 18),
    },
    {
      id: "walk-auto",
      name: "Walk + Auto",
      source,
      destination,
      legs: [
        makeLeg("WALK", Math.round(auto.duration * 0.3), 0),
        makeLeg(
          "AUTO",
          Math.round(auto.duration * 0.7),
          Math.round(auto.distance * 15),
        ),
      ],
      totalTime: auto.duration,
      totalCost: Math.round(auto.distance * 15),
    },
    {
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
    },
    {
      id: "cab-direct",
      name: "Cab direct",
      source,
      destination,
      legs: [makeLeg("CAB", auto.duration, Math.round(auto.distance * 22))],
      totalTime: auto.duration,
      totalCost: Math.round(auto.distance * 22),
    },
  ] as const;

  const baseRoutes: PlannedRoute[] = rawRoutes.map((r) => {
    const legsWithMeta: AnalyzedLeg[] = [];
    const legFailureProbs: number[] = [];
    let accessibilityAggregate = 0;

    for (const leg of r.legs) {
      const { score, issues } = computeLegAccessibilityScore(
        leg,
        userAccessibilityProfile,
      );
      const legFailure = computeLegFailureProbability(leg, score);

      accessibilityAggregate += score;
      legFailureProbs.push(legFailure);

      const notes: string[] = [];
      if (issues.includes("very_long_walk"))
        notes.push("Long walking segment.");
      if (issues.includes("long_walk_for_wheelchair"))
        notes.push("Potentially difficult for wheelchair users.");
      if (issues.includes("elevator_uncertain"))
        notes.push("Elevator availability may be uncertain.");
      if (issues.includes("station_navigation_required"))
        notes.push("May involve station navigation.");
      if (issues.includes("vehicle_step_entry"))
        notes.push("Step entry/exit may be required.");

      legsWithMeta.push({
        ...leg,
        accessibility: {
          score,
          issues,
        },
        failureProbability: Number(legFailure.toFixed(4)),
        notes,
      });
    }

    const routeFailure = clamp01(
      1 - legFailureProbs.reduce((prod, p) => prod * (1 - p), 1),
    );

    const averageAccessibility =
      r.legs.length > 0 ? accessibilityAggregate / r.legs.length : 100;

    return {
      id: r.id,
      name: r.name,
      source: r.source,
      destination: r.destination,
      legs: legsWithMeta,
      totalTime: r.totalTime,
      totalCost: r.totalCost,
      failureProbability: Number(routeFailure.toFixed(4)),
      overallScore: Math.max(
        0,
        Math.min(
          100,
          Math.round(averageAccessibility * (1 - routeFailure * 0.5)),
        ),
      ),
      rank: 999,
      summary: "",
      notes: [],
      alerts: [],
    };
  });

  let analysis: z.infer<typeof routeAnalysisSchema> | null = null;

  try {
    analysis = await analyzeRoutesWithGemini(
      source,
      destination,
      userAccessibilityProfile,
      baseRoutes,
    );
  } catch (error) {
    // Keep a log here just in case the outer function throws before returning null
    console.error("Exception caught calling analyzeRoutesWithGemini:", error);
    analysis = null;
  }

  const routes = mergeGeminiAnalysis(baseRoutes, analysis);

  return {
    recommendedRouteId:
      analysis?.recommendedRouteId ?? routes[0]?.id ?? "auto-direct",
    routes,
    liveDisclaimer:
      analysis?.disclaimer ??
      "Live route notes are advisory and should be confirmed before travel.",
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, destination, accessibility } = body;

    if (!source || !destination) {
      return NextResponse.json(
        { error: "source and destination required" },
        { status: 400 },
      );
    }

    const result = await planJourneyService(
      source,
      destination,
      accessibility ?? null,
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to plan journey" },
      { status: 500 },
    );
  }
}
