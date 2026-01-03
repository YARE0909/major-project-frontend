"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Journey } from "@/types/journey";
import { useParams } from "next/navigation";
import { QrCode } from "lucide-react";

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

  if (loading) return <p className="p-6">Loading journey...</p>;
  if (!journey) return <p className="p-6">Journey not found</p>;

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Journey</h1>

      {/* Journey summary */}
      <div className="mb-6 p-4 rounded bg-zinc-900 border border-zinc-800">
        <p className="text-zinc-400 mb-2">
          ⏱ {journey.totalTime} mins · ₹{journey.totalCost}
        </p>

        <ul className="space-y-1">
          {journey.legs.map((leg, idx) => (
            <li key={idx}>
              {idx + 1}. {leg.mode}: {leg.source} → {leg.destination}
            </li>
          ))}
        </ul>
      </div>

      {/* Travel Pass */}
      <div className="p-4 rounded bg-zinc-900 border border-zinc-800">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <QrCode size={20} /> Travel Pass
        </h2>

        {journey.travelPass?.qrData ? (
          <img
            src={journey.travelPass.qrData}
            alt="Travel Pass QR"
            className="w-48 h-48"
          />
        ) : (
          <p className="text-zinc-400">Generating travel pass...</p>
        )}

        <p className="text-sm text-zinc-400 mt-2">
          Valid till:{" "}
          {journey.travelPass?.validTill
            ? new Date(journey.travelPass.validTill).toLocaleString()
            : "-"}
        </p>
      </div>
    </main>
  );
}
