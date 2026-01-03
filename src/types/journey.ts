export type JourneyLeg = {
  mode: string;
  source: string;
  fromCoords: any;
  toCoords: any;
  destination: string;
  duration: number;
  cost: number;
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

export type JourneyRoute = {
  id: string;
  name?: string;
  source: string;
  destination: string;
  totalTime: number;
  totalCost: number;
  legs: JourneyLeg[];
};
