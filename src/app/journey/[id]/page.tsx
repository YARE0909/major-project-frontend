"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Journey } from "@/types/journey";
import { useParams } from "next/navigation";
import {
  Clock,
  IndianRupee,
  QrCode,
  Map as MapIcon,
  Footprints,
  ArrowRight,
} from "lucide-react";
import Map from "@/components/Map";
import Loader from "@/components/Loader";

export default function JourneyDetailsPage() {
  const params = useParams();
  const journeyId = params.id as string;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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

  useEffect(() => {
    fetchJourney();
  }, [journeyId]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const onScroll = () => {
      const children = Array.from(el.children) as HTMLElement[];
      const center = el.scrollLeft + el.offsetWidth / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      children.forEach((child, idx) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(center - childCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = idx;
        }
      });

      setActiveIndex(closestIndex);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) return <Loader />;
  if (!journey) return <p className="p-6 text-zinc-400">Journey not found</p>;

  return (
    <main className="min-h-screen bg-black px-4 py-6">
      <div className="mb-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight">
            TravelNest
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-400 font-bold">
          One app. Every journey.
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/95 shadow-2xl">
          <div className="flex items-center justify-center gap-2 bg-orange-500/10 px-6 py-3">
            <QrCode size={18} className="text-orange-400" />
            <h1 className="text-sm font-bold uppercase tracking-wide text-orange-300">
              Travel Ticket
            </h1>
          </div>

          <div className="p-6 text-center">
            <div className="relative mb-6">
              <div
                ref={carouselRef}
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide scroll-smooth"
              >
                {journey.legs.filter((leg) => leg.travelPass.qrData).map((leg, idx) => (
                  <div
                    key={leg.id}
                    className={`snap-center shrink-0 w-full rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-md transition-all duration-300`}
                  >
                    <p className="mb-2 text-center text-xs font-bold text-orange-400">
                      {leg.mode} • {leg.source} → {leg.destination}
                    </p>
                    <div className="mx-auto flex aspect-square w-full max-w-60 items-center justify-center rounded-xl">
                      {leg.travelPass?.qrData ? (
                        <img
                          src={leg.travelPass.qrData}
                          alt="Leg Travel Pass"
                          className="h-full w-full rounded-lg object-contain"
                        />
                      ) : (
                        <p className="text-sm text-zinc-500">Generating QR…</p>
                      )}
                    </div>
                    <p className="mt-3 text-center text-xs font-bold text-zinc-400">
                      Step {idx + 1} of {journey.legs.filter((leg) => leg.travelPass.qrData).length}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-center gap-2">
                {journey.legs.filter((leg) => leg.travelPass.qrData).map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeIndex
                        ? "w-4 bg-orange-400"
                        : "w-1.5 bg-zinc-600"
                    }`}
                  />
                ))}
              </div>
            </div>
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
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Footprints size={14} className="text-orange-400" />
            <h2 className="text-sm font-bold tracking-wide text-zinc-200">
              JOURNEY STEPS
            </h2>
          </div>
          <div className="space-y-4">
            {journey.legs.map((leg, idx) => (
              <div
                key={idx}
                className="relative flex gap-4 rounded-xl bg-zinc-800/40 p-3 ring-1 ring-white/5"
              >
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-orange-400 mt-1" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-300">
                      {leg.mode}
                    </p>
                    <span className="text-xs text-zinc-500 font-bold">
                      Step {idx + 1}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-zinc-300 font-bold">
                    {leg.source}
                    <ArrowRight size={12} className="mx-1 inline" />
                    {leg.destination}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-4 shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <MapIcon size={14} className="text-orange-400" />
            <h2 className="text-sm font-bold text-zinc-200">ROUTE OVERVIEW</h2>
          </div>

          <div className="h-44 w-full overflow-hidden rounded-xl border border-zinc-800">
            <Map legs={journey.legs} />
          </div>
        </div>
      </div>
    </main>
  );
}
