export type JourneyLeg = {
  mode: string;
  source: string;
  destination: string;
  duration: number;
  cost: number;

  accessibility?: {
    score: number;
    issues: string[];
  };

  failureProbability?: number;
};
export type TravelPass = {
  id: string;
  journeyId: string;
  validFrom: string;
  validTill: string;
  qrData?: string;
};

export type Booking = {
  id: string;
  status: string;
};

export type Journey = {
  id: string;
  totalTime: number;
  totalCost: number;
  legs: JourneyLeg[];
  booking?: Booking;
  travelPass?: TravelPass;
};

export type MapProps = {
  legs: JourneyLeg[];
  className?: string;
  interactive?: boolean;
  showCurrentLocation?: boolean;
};

export type RouteAlert = {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
  locationHint: string;
  sourceHint?: string;
};

export type JourneyRouteLeg = {
  mode: string;
  source: string;
  destination: string;
  duration: number;
  cost: number;
  fromCoords?: { lat: number; lon: number; displayName?: string };
  toCoords?: { lat: number; lon: number; displayName?: string };
  accessibility?: {
    score: number;
    issues: string[];
  };
  failureProbability?: number;
  notes?: string[];
};

export type JourneyRoute = {
  id: string;
  name: string;
  source: string;
  destination: string;
  legs: JourneyRouteLeg[];
  totalTime: number;
  totalCost: number;
  failureProbability?: number;
  overallScore?: number;
  rank?: number;
  summary?: string;
  notes?: string[];
  alerts?: RouteAlert[];
};