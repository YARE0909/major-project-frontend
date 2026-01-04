"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { JourneyRoute } from "@/types/journey";
import Map from "@/components/Map";
import { useRouter } from "next/navigation";
import Content from "./_components/Content";

export default function JourneyPage() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<JourneyRoute | null>(null);

  const router = useRouter();

  const planJourney = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/journey/plan", { source, destination });
      const newRoutes = res.data.routes || [];

      setRoutes(newRoutes);
      console.log("Planned Routes:", newRoutes);
      setSelectedRoute(newRoutes[0] ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to plan journey");
    } finally {
      setLoading(false);
    }
  };

  const bookRoute = async (route: JourneyRoute) => {
    const res = await api.post("/journey/create", {
      selectedRoute: route,
    });

    router.push(`/payment/${res.data.journeyId}`);
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <Map legs={selectedRoute?.legs ?? []} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-5 h-32 bg-linear-to-t from-black/90 via-black/60 to-transparent md:hidden" />

      <div className="absolute inset-x-0 bottom-0 z-10 md:hidden">
        <div className="mx-auto max-w-3xl rounded-t-3xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl shadow-2xl max-h-[55vh] flex flex-col">
          <div className="flex justify-center pt-3">
            <div className="h-1 w-12 rounded-full bg-zinc-700" />
          </div>

          <Content
            source={source}
            setSource={setSource}
            destination={destination}
            setDestination={setDestination}
            planJourney={planJourney}
            loading={loading}
            error={error}
            routes={routes}
            bookRoute={bookRoute}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
          />
        </div>
      </div>

      <div className="hidden md:block absolute left-4 top-4 bottom-4 z-10 w-95">
        <div className="h-full rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl shadow-2xl flex flex-col">
          <Content
            source={source}
            setSource={setSource}
            destination={destination}
            setDestination={setDestination}
            planJourney={planJourney}
            loading={loading}
            error={error}
            routes={routes}
            bookRoute={bookRoute}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
          />
        </div>
      </div>
    </main>
  );
}
