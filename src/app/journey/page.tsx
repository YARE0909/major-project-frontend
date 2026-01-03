"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { JourneyRoute } from "@/types/journey";
import { MapPin, ArrowRight } from "lucide-react";
import RouteCard from "@/components/RouteCard";
import { useRouter } from "next/navigation";

export default function JourneyPage() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const bookRoute = async (route: JourneyRoute) => {
    try {
      const res = await api.post("/journey/book", {
        selectedRoute: route,
      });

      const journeyId = res.data.id;
      router.push(`/journey/${journeyId}`);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Booking failed");
    }
  };

  const planJourney = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/journey/plan", { source, destination });
      setRoutes(res.data.routes || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to plan journey");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Plan Your Journey</h1>

      {/* Input form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <input
          placeholder="Source"
          className="px-4 py-2 rounded bg-zinc-800 border border-zinc-700"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />

        <input
          placeholder="Destination"
          className="px-4 py-2 rounded bg-zinc-800 border border-zinc-700"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />

        <button
          onClick={planJourney}
          disabled={loading}
          className="rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Planning..." : "Plan Journey"}
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {/* Routes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} onSelect={bookRoute} />
        ))}
      </div>
    </main>
  );
}
