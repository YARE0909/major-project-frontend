"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Journey } from "@/types/journey";
import { useParams } from "next/navigation";
import { Clock, IndianRupee, QrCode, Map } from "lucide-react";
import JourneyMap from "@/components/JourneyMap";

export default function JourneyDetailsPage() {
  const params = useParams();
  const journeyId = params.id as string;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        const res = await api.get(`/journey/${journeyId}`);
        setJourney(res.data.journey);
      } catch {
        alert("Failed to load journey");
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [journeyId]);

  if (loading) return <p className="p-6 text-zinc-400">Loading journey…</p>;
  if (!journey) return <p className="p-6 text-zinc-400">Journey not found</p>;

  return (
    <main className="min-h-screen bg-black px-4 py-6">
      {/* 🌟 BRANDING */}
      <div className="mb-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight">TravelNest</span>
        </div>
        <p className="mt-1 text-xs text-zinc-400 font-bold">
          One app. Every journey.
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-6">
        {/* 🎫 TRAVEL TICKET (HERO) */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/95 shadow-2xl">
          {/* Header strip */}
          <div className="flex items-center justify-center gap-2 bg-orange-500/10 px-6 py-3">
            <QrCode size={18} className="text-orange-400" />
            <h1 className="text-sm font-bold uppercase tracking-wide text-orange-300">
              Travel Ticket
            </h1>
          </div>

          <div className="p-6 text-center">
            {/* QR Frame */}
            <div className="mx-auto mb-4 flex h-52 w-52 items-center justify-center rounded-2xl p-3 ring-1 ring-white/10">
              {journey.travelPass?.qrData ? (
                <img
                  src={journey.travelPass.qrData}
                  alt="Travel Pass QR"
                  className="h-full w-full rounded-md"
                />
              ) : (
                <p className="text-zinc-500">Generating…</p>
              )}
            </div>

            {/* Summary */}
            <div className="flex justify-center gap-6 text-sm font-semibold text-zinc-200">
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-orange-400" />
                {journey.totalTime} mins
              </span>
              <span className="flex items-center gap-1">
                <IndianRupee size={14} className="text-orange-400" />
                {journey.totalCost}
              </span>
            </div>

            <p className="mt-2 text-xs text-zinc-400 font-bold">
              Valid till{" "}
              {journey.travelPass?.validTill
                ? new Date(journey.travelPass.validTill).toLocaleString()
                : "-"}
            </p>
          </div>
        </div>

        {/* 🧭 JOURNEY STEPS */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-5 shadow-lg">
          <h2 className="mb-4 text-sm font-semibold text-zinc-200">
            Journey Steps
          </h2>

          <div className="space-y-5">
            {journey.legs.map((leg, idx) => (
              <div key={idx} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-orange-400" />
                  {idx !== journey.legs.length - 1 && (
                    <div className="mt-1 h-full w-px bg-zinc-600" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-300">
                    {leg.mode}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {leg.source} → {leg.destination}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🗺️ MAP PREVIEW */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-4 shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <Map size={14} className="text-orange-400" />
            <h2 className="text-xs font-semibold text-zinc-300">
              Route Overview
            </h2>
          </div>

          <div className="h-44 w-full overflow-hidden rounded-xl border border-zinc-800">
            <JourneyMap legs={journey.legs} />
          </div>
        </div>
      </div>
    </main>
  );
}
