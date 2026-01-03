import dynamic from "next/dynamic";
import { JourneyLeg } from "@/types/journey";

// Client-only component wrapper
const JourneyMapClient = dynamic(
  () => import("./JourneyMap.client"),
  { ssr: false }
);

export default function JourneyMap({ legs }: { legs: JourneyLeg[] }) {
  return <JourneyMapClient legs={legs} />;
}
