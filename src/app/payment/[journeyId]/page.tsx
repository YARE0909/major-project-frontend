"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Clock,
  IndianRupee,
  Footprints,
  ArrowRight,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import Loader from "@/components/Loader";

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
        toast.error("Failed to load journey");
      } finally {
        setLoading(false);
      }
    };
    loadJourney();
  }, [journeyId]);

  const pay = async () => {
    setPaying(true);

    const toastId = toast.loading("Initiating payment…");

    try {
      const startRes = await api.post("/payment/start", { journeyId });
      const paymentId = startRes.data.id;

      toast.loading("Confirming payment…", { id: toastId });

      const confirmRes = await api.post("/payment/confirm", { paymentId });

      toast.success("Payment successful 🎉", { id: toastId });

      router.push(`/journey/${confirmRes.data.journeyId}`);
    } catch {
      toast.error("Payment failed. Please try again.", { id: toastId });
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Loader />;
  if (!journey) return null;

  return (
    <main className="min-h-screen bg-linear-to-b from-black via-zinc-950 to-black px-4 py-8 text-white">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight">
            Review & Pay
          </h1>
          <p className="text-xs font-bold text-zinc-400">
            Secure payment powered by TravelNest
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 text-center shadow-2xl backdrop-blur">
          <p className="text-xs font-bold text-zinc-400 uppercase">
            Amount Payable
          </p>
          <p className="mt-2 text-4xl font-extrabold text-orange-400">
            ₹{journey.totalCost}
          </p>

          <div className="mt-3 flex justify-center gap-6 text-xs text-zinc-400 font-bold">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {journey.totalTime} mins
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee size={12} />
              Inclusive of taxes
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-lg backdrop-blur">
          <div className="mb-4 flex items-center gap-2">
            <Footprints size={14} className="text-orange-400" />
            <h2 className="text-sm font-bold">Journey Breakdown</h2>
          </div>

          <div className="space-y-3">
            {journey.legs.map((leg: any) => (
              <div
                key={leg.id}
                className="flex justify-between rounded-xl bg-zinc-800/50 p-3"
              >
                <div>
                  <span className="inline-block rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                    {leg.mode}
                  </span>

                  <p className="mt-1 text-xs font-bold text-zinc-300">
                    {leg.source}
                    <ArrowRight size={12} className="inline mx-1" />
                    {leg.destination}
                  </p>

                  <p className="text-[11px] font-bold text-zinc-500">
                    {leg.duration} mins
                  </p>
                </div>

                <div className="text-sm font-extrabold text-zinc-200">
                  ₹{leg.cost}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-sm font-extrabold">
            <span>Total</span>
            <span className="text-orange-400">₹{journey.totalCost}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-500">
          <ShieldCheck size={14} className="text-green-400" />
          100% secure & encrypted payment
        </div>

        <button
          onClick={pay}
          disabled={paying}
          className="w-full rounded-2xl bg-orange-500 py-4 text-black font-extrabold flex items-center justify-center gap-2 transition hover:bg-orange-400 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          <CreditCard size={18} />
          {paying ? "Processing payment…" : `Pay ₹${journey.totalCost}`}
        </button>
      </div>
    </main>
  );
}
