import { JourneyLeg } from "@/types/journey";

export type MapProps = {
  legs: JourneyLeg[];
  className?: string;
  interactive?: boolean;
  showCurrentLocation?: boolean;
};
