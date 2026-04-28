"use client";

import {
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  ReactPortal,
  Key,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/api";
import { Journey } from "@/types/journey";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  IndianRupee,
  QrCode,
  Map as MapIcon,
  Footprints,
  ArrowRight,
  ShieldCheck,
  Ticket,
  Home,
} from "lucide-react";
import Map from "@/components/Map";
import Loader from "@/components/Loader";
import { getToken } from "@/lib/auth";

export default function JourneyDetailsPage() {
  const params = useParams();
  const journeyId = params.id as string;

  const [journey, setJourney] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const router = useRouter();

  const fetchJourney = async () => {
    try {
      const res = await api.get(`/journey/${journeyId}`);
      setJourney(res.data.journey);
    } catch {
      alert("Failed to load journey details");
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

  // ── Redirect if not logged in ──
  useEffect(() => {
    // If you don't have getToken exported, you can use: localStorage.getItem("token")
    const token = getToken ? getToken() : null;

    if (!token) {
      router.push("/");
    }
  }, [router]);

  if (loading) return <Loader />;
  if (!journey)
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-neutral-500 font-medium tracking-wide">
          Journey not found
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
        >
          <Home size={16} />
          Return Home
        </Link>
      </div>
    );

  const qrLegs = journey.legs.filter(
    (leg: { travelPass: { qrData: any } }) => leg.travelPass?.qrData,
  );

  return (
    <main className="relative min-h-[100dvh] w-full bg-neutral-950 p-4 sm:p-6 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      {/* ── Ambient Background Glows ── */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-md space-y-6 z-10 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-8">
        {/* ── Top Navigation & Header ── */}
        <div className="relative flex items-center justify-center mb-6 mt-2">
          {/* Back/Home Button */}
          <Link
            href="/"
            className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all backdrop-blur-md shadow-sm active:scale-95"
            aria-label="Return to Home"
          >
            <Home size={18} />
          </Link>

          {/* Title */}
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div className="inline-flex items-center justify-center p-2.5 bg-neutral-900 border border-neutral-800 rounded-2xl mb-1 shadow-lg">
              <Ticket size={22} className="text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Digital Pass
            </h1>
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-500/80" /> Verified
              by TravelNest
            </p>
          </div>
        </div>

        {/* ── QR Ticket Carousel ── */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          <div className="flex items-center justify-center gap-2 bg-indigo-500/10 border-b border-neutral-800/80 px-6 py-3">
            <QrCode size={16} className="text-indigo-400" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
              Scan to Travel
            </h2>
          </div>

          <div className="p-6 text-center">
            {qrLegs.length > 0 ? (
              <div className="relative mb-6">
                <div
                  ref={carouselRef}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-4 scrollbar-hide scroll-smooth"
                >
                  {qrLegs.map(
                    (
                      leg: {
                        id: any;
                        mode:
                          | string
                          | number
                          | bigint
                          | boolean
                          | ReactElement<
                              unknown,
                              string | JSXElementConstructor<any>
                            >
                          | Iterable<ReactNode>
                          | ReactPortal
                          | Promise<
                              | string
                              | number
                              | bigint
                              | boolean
                              | ReactPortal
                              | ReactElement<
                                  unknown,
                                  string | JSXElementConstructor<any>
                                >
                              | Iterable<ReactNode>
                              | null
                              | undefined
                            >
                          | null
                          | undefined;
                        source:
                          | string
                          | number
                          | bigint
                          | boolean
                          | ReactElement<
                              unknown,
                              string | JSXElementConstructor<any>
                            >
                          | Iterable<ReactNode>
                          | ReactPortal
                          | Promise<
                              | string
                              | number
                              | bigint
                              | boolean
                              | ReactPortal
                              | ReactElement<
                                  unknown,
                                  string | JSXElementConstructor<any>
                                >
                              | Iterable<ReactNode>
                              | null
                              | undefined
                            >
                          | null
                          | undefined;
                        destination:
                          | string
                          | number
                          | bigint
                          | boolean
                          | ReactElement<
                              unknown,
                              string | JSXElementConstructor<any>
                            >
                          | Iterable<ReactNode>
                          | ReactPortal
                          | Promise<
                              | string
                              | number
                              | bigint
                              | boolean
                              | ReactPortal
                              | ReactElement<
                                  unknown,
                                  string | JSXElementConstructor<any>
                                >
                              | Iterable<ReactNode>
                              | null
                              | undefined
                            >
                          | null
                          | undefined;
                        travelPass: { qrData: string | Blob | undefined };
                      },
                      idx: number,
                    ) => (
                      <div
                        key={leg.id || idx}
                        className="snap-center shrink-0 w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-inner flex flex-col items-center transition-all duration-300"
                      >
                        <div className="mb-4 w-full flex items-center justify-between">
                          <span className="inline-block rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                            {leg.mode}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                            {idx + 1} of {qrLegs.length}
                          </span>
                        </div>

                        <p className="mb-4 text-center text-xs font-medium text-neutral-300 flex items-center gap-2">
                          {leg.source}{" "}
                          <ArrowRight size={12} className="text-neutral-600" />{" "}
                          {leg.destination}
                        </p>

                        {/* White background behind QR to ensure scanning works on dark mode */}
                        <div className="mx-auto flex aspect-square w-full max-w-[200px] items-center justify-center rounded-xl p-2 border-4 border-neutral-800 shadow-md">
                          {leg.travelPass?.qrData ? (
                            <img
                              src={leg.travelPass.qrData}
                              alt="Leg Travel Pass"
                              className="h-full w-full rounded-lg object-contain"
                            />
                          ) : (
                            <p className="text-sm text-zinc-500">
                              Generating QR…
                            </p>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                {/* Dots */}
                {qrLegs.length > 1 && (
                  <div className="mt-2 flex justify-center gap-1.5">
                    {qrLegs.map((_: any, idx: Key | null | undefined) => (
                      <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === activeIndex
                            ? "w-4 bg-indigo-400"
                            : "w-1.5 bg-neutral-700"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-xs font-medium text-neutral-500 uppercase tracking-widest">
                No QR passes required for this journey.
              </div>
            )}

            {/* Total Journey Metrics */}
            <div className="inline-flex items-center justify-center gap-4 text-xs font-semibold text-neutral-300 bg-neutral-950/50 px-5 py-2.5 rounded-xl border border-neutral-800/80">
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-400" />
                {journey.totalTime} mins
              </span>
              <div className="w-[1px] h-3 bg-neutral-700" />
              <span className="flex items-center gap-1.5">
                <IndianRupee size={14} className="text-emerald-400" />
                {journey.totalCost} Total
              </span>
            </div>
          </div>
        </div>

        {/* ── Journey Steps ── */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 mb-5">
            <Footprints size={14} className="text-neutral-400" />
            <h2 className="text-[10px] font-bold tracking-widest uppercase text-neutral-300">
              Journey Timeline
            </h2>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-y-4 before:left-[11px] before:w-[2px] before:bg-neutral-800/80">
            {journey.legs.map(
              (
                leg: {
                  mode:
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | Promise<
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactPortal
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<any>
                          >
                        | Iterable<ReactNode>
                        | null
                        | undefined
                      >
                    | null
                    | undefined;
                  source:
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | Promise<
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactPortal
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<any>
                          >
                        | Iterable<ReactNode>
                        | null
                        | undefined
                      >
                    | null
                    | undefined;
                  destination:
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | Promise<
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactPortal
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<any>
                          >
                        | Iterable<ReactNode>
                        | null
                        | undefined
                      >
                    | null
                    | undefined;
                },
                idx: number,
              ) => (
                <div
                  key={idx}
                  className="relative pl-8 flex justify-between items-center group"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-[7px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-neutral-950 border-2 border-neutral-600 group-hover:border-indigo-400 transition-colors z-10" />

                  <div className="w-full rounded-xl bg-neutral-950/50 border border-neutral-800/80 p-3.5 shadow-sm group-hover:border-neutral-700 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="inline-block rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                        {leg.mode}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                        Step {idx + 1}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5 truncate">
                      {leg.source}
                      <ArrowRight
                        size={10}
                        className="text-neutral-600 shrink-0"
                      />
                      {leg.destination}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* ── Map Overview ── */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 shadow-lg backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2">
            <MapIcon size={14} className="text-neutral-400" />
            <h2 className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
              Route Overview
            </h2>
          </div>

          <div className="h-48 w-full overflow-hidden rounded-xl border border-neutral-800 shadow-inner relative z-0">
            <Map legs={journey.legs} />
            {/* Map overlay border to soften edges */}
            <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-xl" />
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <Link
          href="/"
          className="relative w-full h-14 rounded-xl font-bold text-sm bg-white text-black overflow-hidden transition-all active:scale-[0.98] shadow-lg shadow-white/5 flex items-center justify-center gap-2 hover:bg-neutral-200 mt-6"
        >
          <Home size={18} className="text-neutral-800" />
          Plan Another Journey
        </Link>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </main>
  );
}
