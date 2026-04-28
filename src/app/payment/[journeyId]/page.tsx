"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Clock,
  IndianRupee,
  ArrowRight,
  CreditCard,
  ShieldCheck,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import Loader from "@/components/Loader";
import { getToken } from "@/lib/auth";

export default function PaymentPage({
  params,
}: {
  params: Promise<{ journeyId: string }>;
}) {
  const { journeyId } = use(params);
  const router = useRouter();

  const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const loadJourney = async () => {
      try {
        const res = await api.get(`/journey/${journeyId}`);
        setJourney(res.data.journey);
      } catch {
        toast.error("Failed to load journey details");
      } finally {
        setLoading(false);
      }
    };
    loadJourney();
  }, [journeyId]);

  const pay = async () => {
    setPaying(true);
    const toastId = toast.loading("Securing payment connection…");

    try {
      const startRes = await api.post("/payment/start", { journeyId });
      const paymentId = startRes.data.id;

      toast.loading("Confirming transaction…", { id: toastId });
      const confirmRes = await api.post("/payment/confirm", { paymentId });

      toast.success("Payment successful", { id: toastId });
      router.push(`/journey/${confirmRes.data.journeyId}`);
    } catch {
      toast.error("Transaction failed. Please try again.", { id: toastId });
    } finally {
      setPaying(false);
    }
  };

  // ── Redirect if not logged in ──
  useEffect(() => {
    // If you don't have getToken exported, you can use: localStorage.getItem("token")
    const token = getToken ? getToken() : null;

    if (!token) {
      router.push("/");
    }
  }, [router]);

  if (loading) return <Loader />;
  if (!journey) return null;

  return (
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center bg-neutral-950 p-4 sm:p-6 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      {/* ── Ambient Background Glows ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6 z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* ── Header ── */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center p-3 bg-neutral-900 border border-neutral-800 rounded-2xl mb-2 shadow-lg">
            <ShieldCheck size={24} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Secure Checkout
          </h1>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest">
            Powered by TravelNest Intelligence
          </p>
        </div>

        {/* ── Total Amount Card ── */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
            Total Amount Payable
          </p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-medium text-neutral-500">₹</span>
            <span className="text-5xl font-bold text-white tracking-tight">
              {journey.totalCost}
            </span>
          </div>

          <div className="mt-6 inline-flex items-center gap-4 text-xs font-semibold text-neutral-300 bg-neutral-950/50 px-4 py-2 rounded-xl border border-neutral-800/80">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-400" />
              {journey.totalTime} mins
            </span>
            <div className="w-[1px] h-3 bg-neutral-700" />
            <span className="flex items-center gap-1.5 text-neutral-400">
              <CheckCircle2 size={14} className="text-emerald-400" />
              Taxes Included
            </span>
          </div>
        </div>

        {/* ── Journey Breakdown ── */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-neutral-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-300">
                Journey Breakdown
              </h2>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-500/20">
              {journey.legs.length} Segments
            </span>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-y-4 before:left-[11px] before:w-[2px] before:bg-neutral-800/80">
            {journey.legs.map((leg: any, index: number) => (
              <div
                key={leg.id || index}
                className="relative pl-8 flex justify-between items-center group"
              >
                {/* Timeline Dot */}
                <div className="absolute left-[7px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-neutral-950 border-2 border-neutral-600 group-hover:border-indigo-400 transition-colors z-10" />

                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                      {leg.mode}
                    </span>
                    <p className="text-[10px] font-medium text-neutral-500">
                      {leg.duration}m
                    </p>
                  </div>

                  <p className="text-xs font-medium text-neutral-200 truncate flex items-center gap-1.5">
                    {leg.source}
                    <ArrowRight
                      size={10}
                      className="text-neutral-600 shrink-0"
                    />
                    {leg.destination}
                  </p>
                </div>

                <div className="text-sm font-bold text-white shrink-0">
                  ₹{leg.cost}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-between items-center border-t border-neutral-800/80 pt-4">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Subtotal
            </span>
            <span className="text-sm font-bold text-white">
              ₹{journey.totalCost}
            </span>
          </div>
        </div>

        {/* ── Security Badge ── */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
          <ShieldCheck size={14} className="text-emerald-500/70" />
          End-to-End Encrypted
        </div>

        {/* ── Checkout Button ── */}
        <button
          onClick={pay}
          disabled={paying}
          className="relative w-full h-14 rounded-xl font-bold text-sm bg-white text-black overflow-hidden disabled:opacity-50 disabled:scale-100 transition-all active:scale-[0.98] shadow-lg shadow-white/5 flex items-center justify-center gap-2 hover:bg-neutral-200"
        >
          {paying ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-neutral-400 border-t-black animate-spin" />
              Processing Securely...
            </>
          ) : (
            <>
              <CreditCard size={18} className="text-neutral-800" />
              Authorize Payment of ₹{journey.totalCost}
            </>
          )}
        </button>
      </div>
    </main>
  );
}
