"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { JourneyRoute } from "@/types/journey";
import RouteCard from "@/components/RouteCard";
import Map from "@/components/Map";
import { MapPin, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

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
      setSelectedRoute(newRoutes[0] ?? null); // 👈 IMPORTANT
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to plan journey");
    } finally {
      setLoading(false);
    }
  };

  const bookRoute = async (route: JourneyRoute) => {
    try {
      const res = await api.post("/journey/book", {
        selectedRoute: route,
      });
      router.push(`/journey/${res.data.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Booking failed");
    }
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      {/* MAP */}
      <div className="absolute inset-0 z-0">
        <Map legs={selectedRoute?.legs ?? []} />
      </div>

      {/* MAP FADE (mobile only) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-5 h-32 bg-linear-to-t from-black/90 via-black/60 to-transparent md:hidden" />

      {/* ================= MOBILE BOTTOM SHEET ================= */}
      <div className="absolute inset-x-0 bottom-0 z-10 md:hidden">
        <div className="mx-auto max-w-3xl rounded-t-3xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl shadow-2xl max-h-[95vh] flex flex-col">
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

      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden md:block absolute left-4 top-4 bottom-4 z-10 w-[380px]">
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

/* ================= SHARED CONTENT ================= */

function Content({
  source,
  setSource,
  destination,
  setDestination,
  planJourney,
  loading,
  error,
  routes,
  bookRoute,
  selectedRoute,
  setSelectedRoute,
}: any) {
  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
      {/* BRANDING */}
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-lg font-bold tracking-tight">TravelNest</h1>
      </div>
      <p className="text-xs text-zinc-400 -mt-2 font-bold">
        One app. Every journey.
      </p>

      {/* INPUTS */}
      <div className="space-y-3">
        <div className="relative">
          <MapPin
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"
          />
          <input
            placeholder="From where?"
            className="w-full rounded-xl bg-zinc-800/70 border border-zinc-700/60 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        <div className="relative">
          <ArrowRight
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"
          />
          <input
            placeholder="Where to?"
            className="w-full rounded-xl bg-zinc-800/70 border border-zinc-700/60 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        <button
          onClick={planJourney}
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 py-3 font-bold text-black hover:bg-orange-400 active:scale-[0.98] disabled:opacity-60 transition cursor-pointer"
        >
          {loading ? "Finding routes…" : "Find routes"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* ROUTES */}
      <div className="space-y-3">
        {routes.map((route: JourneyRoute) => (
          <RouteCard
            key={route.id}
            route={route}
            allRoutes={routes}
            isSelected={selectedRoute?.id === route.id}
            onPreview={setSelectedRoute}
            onSelect={bookRoute}
          />
        ))}
      </div>
    </div>
  );
}
