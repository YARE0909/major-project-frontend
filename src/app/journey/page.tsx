"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { JourneyRoute } from "@/types/journey";
import Map from "@/components/Map";
import { useRouter } from "next/navigation";
import Content from "./_components/Content";
import AiAnalysisPanel from "./_components/AiAnalysisPanel";

export default function JourneyPage() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Controls which route is previewed on the map and active in the panel
  const [selectedRoute, setSelectedRoute] = useState<JourneyRoute | null>(null);
  const [liveDisclaimer, setLiveDisclaimer] = useState<string | null>(null);
  
  const [accessibility, setAccessibility] = useState({
    wheelchair: false, blind: false, deaf: false, cognitive: false, fatigue: false,
  });

  const router = useRouter();

  const planJourney = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/journey/plan", { source, destination, accessibility });
      const newRoutes: JourneyRoute[] = res.data.routes || [];
      setRoutes(newRoutes);
      setLiveDisclaimer(res.data.liveDisclaimer ?? null);
      
      // Auto-select the recommended route ONLY on desktop so mobile users 
      // don't immediately get pushed to the AI modal before seeing the list.
      if (window.innerWidth >= 768) {
        const recommendedId = res.data.recommendedRouteId;
        const preferred = newRoutes.find((r) => r.id === recommendedId) ?? newRoutes[0] ?? null;
        setSelectedRoute(preferred);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to plan journey");
    } finally {
      setLoading(false);
    }
  };

  const bookRoute = async (route: JourneyRoute) => {
    const res = await api.post("/journey/create", { selectedRoute: route });
    router.push(`/payment/${res.data.journeyId}`);
  };

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-neutral-950">
      {/* ── Background Map ── */}
      <div className="absolute inset-0 z-0">
        <Map legs={selectedRoute?.legs ?? []} />
      </div>

      {/* ── Desktop: Left Sidebar (Search & Routes) ── */}
      <div className="hidden md:flex absolute left-6 top-6 bottom-6 z-20 w-[380px] xl:w-[420px]">
        <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
          <Content 
            source={source} setSource={setSource}
            destination={destination} setDestination={setDestination}
            planJourney={planJourney} loading={loading} error={error}
            routes={routes} selectedRoute={selectedRoute} setSelectedRoute={setSelectedRoute}
            accessibility={accessibility} setAccessibility={setAccessibility} liveDisclaimer={liveDisclaimer}
          />
        </div>
      </div>

      {/* ── Mobile: Bottom Sheet (Search & Routes) ── */}
      <div className="md:hidden absolute inset-x-0 bottom-0 z-20 flex flex-col pointer-events-none">
        {/* Soft gradient fade above the sheet */}
        <div className="h-24 bg-gradient-to-t from-neutral-950/80 to-transparent" />
        
        {/* Dynamic height sheet based on whether routes exist */}
        <div className={`pointer-events-auto mx-2 mb-2 rounded-[2rem] border border-neutral-800 bg-neutral-900/95 backdrop-blur-xl shadow-[0_-8px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${routes.length > 0 ? "h-[75dvh]" : "max-h-[55dvh]"}`}>
          <div className="flex justify-center pt-4 pb-2 shrink-0 bg-neutral-900/40">
            <div className="w-12 h-1.5 rounded-full bg-neutral-700" />
          </div>
          <Content 
            source={source} setSource={setSource}
            destination={destination} setDestination={setDestination}
            planJourney={planJourney} loading={loading} error={error}
            routes={routes} selectedRoute={selectedRoute} setSelectedRoute={setSelectedRoute}
            accessibility={accessibility} setAccessibility={setAccessibility} liveDisclaimer={liveDisclaimer}
          />
        </div>
      </div>

      {/* ── Desktop & Mobile: AI Analysis Panel ── */}
      {selectedRoute && (
        <>
          {/* Desktop Right Sidebar */}
          <div className="hidden md:flex absolute right-6 top-6 bottom-6 z-30 w-[420px] animate-in slide-in-from-right-8 duration-300">
            <AiAnalysisPanel 
              route={selectedRoute} 
              onClose={() => setSelectedRoute(null)} 
              onBook={bookRoute} 
            />
          </div>

          {/* Mobile Overlay Modal */}
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Clickable background to dismiss */}
            <div className="absolute inset-0" onClick={() => setSelectedRoute(null)} />
            
            {/* Modal Content */}
            <div className="relative w-full h-[85dvh] bg-neutral-900 rounded-t-[2rem] overflow-hidden animate-in slide-in-from-bottom-full duration-300 ease-out border-t border-neutral-800 shadow-2xl flex flex-col">
              <div className="flex justify-center pt-4 pb-2 shrink-0 absolute top-0 inset-x-0 z-10 bg-gradient-to-b from-neutral-900 to-transparent">
                <div className="w-12 h-1.5 rounded-full bg-neutral-700" />
              </div>
               <AiAnalysisPanel 
                route={selectedRoute} 
                onClose={() => setSelectedRoute(null)} 
                onBook={bookRoute} 
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
}