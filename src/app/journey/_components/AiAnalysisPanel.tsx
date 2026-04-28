import { JourneyRoute } from "@/types/journey";
import {
  AlertTriangle,
  FileText,
  Clock,
  IndianRupee,
  Gauge,
  X,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from "lucide-react";

type Props = {
  route: JourneyRoute;
  onClose: () => void;
  onBook: (route: JourneyRoute) => void;
};

export default function AiAnalysisPanel({ route, onClose, onBook }: Props) {
  return (
    <div className="flex flex-col h-full font-[family-name:var(--font-geist-sans)] bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 text-neutral-200 shadow-2xl md:rounded-2xl">
      
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between p-5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-neutral-400" />
          <h2 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase">
            Smart Analysis
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Score & Title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white leading-tight">
              {route.name}
            </h3>
            {route.summary && (
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                {route.summary}
              </p>
            )}
          </div>
          <div className="shrink-0 text-center bg-neutral-950 border border-neutral-800 rounded-xl p-3 min-w-[70px]">
             <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-1">Score</p>
             <p className="text-2xl font-bold text-white">{route.overallScore ?? 0}</p>
          </div>
        </div>

        {/* Live Alerts */}
        {route.alerts?.length ? (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Live Alerts</h4>
            <div className="space-y-2">
              {route.alerts.map((alert, idx) => {
                const isHigh = alert.severity === "high";
                const colorMap = isHigh 
                  ? "bg-red-500/10 border-red-500/20 text-red-400" 
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400";
                  
                return (
                  <div key={idx} className={`p-4 rounded-xl border ${colorMap}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle size={14} />
                      <p className="text-sm font-semibold">{alert.title}</p>
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed">{alert.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Notes */}
        {route.notes?.length ? (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Key Insights</h4>
            <ul className="space-y-2 bg-neutral-950/50 rounded-xl p-4 border border-neutral-800">
              {route.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 size={14} className="text-neutral-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-neutral-300">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Leg Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Journey Legs</h4>
          <div className="space-y-3">
            {route.legs.map((leg, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{leg.mode}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{leg.source} → {leg.destination}</p>
                  </div>
                  <div className="flex gap-3 text-xs font-medium text-neutral-300">
                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-neutral-500"/> {leg.duration}m</span>
                    <span className="flex items-center gap-1.5"><IndianRupee size={12} className="text-neutral-500"/> {leg.cost}</span>
                  </div>
                </div>
                
                {typeof leg.accessibility?.score === "number" && (
                  <div className="space-y-1.5 border-t border-neutral-800 pt-3 mt-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-500 flex items-center gap-1"><Gauge size={12}/> Accessibility</span>
                      <span className="text-neutral-300">{leg.accessibility.score}%</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-400 rounded-full" style={{ width: `${leg.accessibility.score}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer / CTA ── */}
      <div className="shrink-0 p-5 border-t border-neutral-800 bg-neutral-900/95">
        <button
          onClick={() => onBook(route)}
          className="w-full h-12 rounded-xl font-medium text-sm bg-white text-black hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
        >
          Proceed to Booking
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}