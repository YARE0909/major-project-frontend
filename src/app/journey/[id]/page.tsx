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
  useCallback,
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
  Camera,
  X,
  EyeOff,
  Loader2,
  ScanEye,
  PhoneCall,
  Volume2,
  AlertTriangle,
  MapPin,
  Plus, // Added for the expandable FAB menu
} from "lucide-react";
import Map from "@/components/Map";
import Loader from "@/components/Loader";
import { getToken } from "@/lib/auth";

/* ─────────────────────────────────────────────────────────────
   TTS Helper
───────────────────────────────────────────────────────────── */
const speak = (text: string, interrupt = false) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (interrupt) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
};

/* ─────────────────────────────────────────────────────────────
   Main Page Component
───────────────────────────────────────────────────────────── */
export default function JourneyDetailsPage() {
  const params = useParams();
  const journeyId = params.id as string;

  const [journey, setJourney] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const router = useRouter();

  // ── Menu State ──────────────────────────────────────────────
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ── Camera Assistant state ──────────────────────────────────
  const [cameraMode, setCameraMode] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<any>(null);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const lastAnnouncedRef = useRef<string>("");

  // ── SOS State & Refs ────────────────────────────────────────
  const [sosActive, setSosActive] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenOscRef = useRef<OscillatorNode | null>(null);
  const sirenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch journey ──────────────────────────────────────────
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

  // ── Carousel scroll tracker ────────────────────────────────
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

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    const token = getToken ? getToken() : null;
    if (!token) router.push("/");
  }, [router]);

  // ── Load COCO-SSD model lazily ──────────────────────────────
  const loadModel = useCallback(async () => {
    if (modelRef.current) return;
    setModelLoading(true);
    try {
      await import("@tensorflow/tfjs");
      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      modelRef.current = await cocoSsd.load();
    } catch (err) {
      console.error("Model load error:", err);
      setCameraError(
        "Failed to load detection model. Please check your connection.",
      );
    } finally {
      setModelLoading(false);
    }
  }, []);

  // ── Object detection loop ───────────────────────────────────
  const startDetection = useCallback(() => {
    if (detectionIntervalRef.current)
      clearInterval(detectionIntervalRef.current);

    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const model = modelRef.current;

      if (!video || !canvas || !model || video.readyState < 2) return;

      try {
        const predictions: Array<{
          class: string;
          score: number;
          bbox: [number, number, number, number];
        }> = await model.detect(video);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const highConfidence = predictions.filter((p) => p.score >= 0.5);
        const labels: string[] = [];

        highConfidence.forEach((pred) => {
          const [x, y, w, h] = pred.bbox;
          const label = `${pred.class} ${Math.round(pred.score * 100)}%`;
          labels.push(pred.class);

          ctx.strokeStyle = "#6366f1";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);

          const cornerLen = 14;
          ctx.strokeStyle = "#a5b4fc";
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + w, y + h - cornerLen); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - cornerLen, y + h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + cornerLen, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - cornerLen); ctx.stroke();

          const textWidth = ctx.measureText(label).width;
          const pillW = textWidth + 16;
          const pillH = 24;
          const pillX = x;
          const pillY = y - pillH - 4 < 0 ? y + 4 : y - pillH - 4;

          ctx.fillStyle = "rgba(99, 102, 241, 0.85)";
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, 6);
          ctx.fill();

          ctx.fillStyle = "#fff";
          ctx.font = "bold 13px -apple-system, sans-serif";
          ctx.fillText(label, pillX + 8, pillY + 16);
        });

        setDetectedObjects(labels);

        const announcement = [...new Set(labels)].join(", ");
        if (announcement && announcement !== lastAnnouncedRef.current) {
          lastAnnouncedRef.current = announcement;
          speak(`Detected: ${announcement}`, true);
        } else if (!announcement && lastAnnouncedRef.current) {
          lastAnnouncedRef.current = "";
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 2500);
  }, []);

  // ── Stop camera fully ───────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActiveStream(null);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    lastAnnouncedRef.current = "";
    setDetectedObjects([]);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (activeStream && video.srcObject !== activeStream) {
      video.srcObject = activeStream;
    } else if (!activeStream) {
      video.srcObject = null;
    }
  }, [activeStream]);

  const openCameraStream = useCallback(async (): Promise<MediaStream | null> => {
    const constraintOptions = [
      { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: { ideal: "environment" } } },
      { video: true },
    ];

    for (const constraints of constraintOptions) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          throw err;
        }
        console.warn("Camera constraint failed, trying fallback:", err?.name);
      }
    }
    return null;
  }, []);

  const requestPermissionAndStart = useCallback(async () => {
    setCameraError(null);
    setPermissionState("requesting");
    speak("Requesting camera permission.", true);

    let stream: MediaStream | null = null;

    try {
      stream = await openCameraStream();
    } catch (err: any) {
      const isDenied =
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      setPermissionState("denied");
      speak(
        isDenied
          ? "Camera permission denied. Please open your browser settings, find this site, and allow camera access. Then tap Try Again."
          : "No camera found on this device.",
        true,
      );
      return;
    }

    if (!stream) {
      setPermissionState("denied");
      speak("No camera found on this device.", true);
      return;
    }

    streamRef.current = stream;
    setPermissionState("granted");
    setActiveStream(stream);

    speak("Loading object detection model.", true);
    await loadModel();

    speak("Camera ready. I will announce objects as I detect them.");
    startDetection();
  }, [openCameraStream, loadModel, startDetection]);

  const toggleCameraMode = useCallback(async () => {
    if (!cameraMode) {
      speak("Camera assistant enabled.", true);
      setCameraMode(true);
      setCameraError(null);
      setDetectedObjects([]);
      setPermissionState("idle");
      await requestPermissionAndStart();
    } else {
      speak("Camera assistant disabled.", true);
      stopCamera();
      setCameraMode(false);
      setPermissionState("idle");
    }
  }, [cameraMode, requestPermissionAndStart, stopCamera]);

  // ── SOS Handlers (Enhanced) ───────────────────────────────
  const startSiren = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "square";
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Control volume slightly to avoid deafening the user, but keep it loud
      gainNode.gain.value = 0.5;

      let isHigh = false;
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      
      const interval = setInterval(() => {
        const freq = isHigh ? 800 : 1200;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        isHigh = !isHigh;
      }, 400);

      osc.start();
      sirenOscRef.current = osc;
      sirenIntervalRef.current = interval;
    } catch (e) {
      console.log("Audio not supported or blocked", e);
    }
  }, []);

  const stopSiren = useCallback(() => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (sirenOscRef.current) {
      sirenOscRef.current.stop();
      sirenOscRef.current.disconnect();
      sirenOscRef.current = null;
    }
  }, []);

  const handleSOSClick = useCallback(() => {
    speak("Emergency SOS activated. Siren playing. Select an option.", true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      // Intense haptic pattern
      navigator.vibrate([500, 250, 500, 250, 500, 250, 1000]);
    }
    setSosActive(true);
    startSiren();
  }, [startSiren]);

  const handleCloseSOS = useCallback(() => {
    setSosActive(false);
    stopSiren();
    speak("Emergency SOS cancelled.");
  }, [stopSiren]);

  const handleShareLocation = useCallback(() => {
    setSharingLocation(true);
    speak("Fetching your location.");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const text = `🚨 EMERGENCY! I need help. My exact location: https://maps.google.com/?q=${latitude},${longitude}`;
          
          try {
            if (navigator.share) {
              await navigator.share({
                title: 'Emergency SOS Location',
                text: text,
              });
              speak("Location shared successfully.");
            } else {
              // Fallback if Web Share API is not supported
              alert("Your device does not support native sharing. Here is your emergency link:\n\n" + text);
              speak("Location generated.");
            }
          } catch (err) {
            console.log("Share failed or was cancelled", err);
          }
          setSharingLocation(false);
        },
        () => {
          alert("Could not retrieve your location. Please ensure location permissions are granted.");
          speak("Failed to fetch location.");
          setSharingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setSharingLocation(false);
    }
  }, []);

  const readJourneySummary = useCallback(() => {
    if (!journey) {
      speak("Journey details not available yet.");
      return;
    }
    const summaryText =
      `Your journey will take ${journey.totalTime} minutes and cost ${journey.totalCost} rupees. ` +
      `It consists of ${journey.legs.length} steps. ` +
      journey.legs
        .map(
          (leg: any, idx: number) =>
            `Step ${idx + 1}, take ${leg.mode} from ${leg.source} to ${leg.destination}.`
        )
        .join(" ");

    speak(summaryText, true);
  }, [journey]);

  // ── Cleanup on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      stopSiren();
      window.speechSynthesis?.cancel();
    };
  }, [stopSiren]);

  // ── Early returns ───────────────────────────────────────────
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
    <>
      {/* ══════════════════════════════════════════════════════
          EMERGENCY SOS OVERLAY MODAL
      ══════════════════════════════════════════════════════ */}
      {sosActive && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in zoom-in duration-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/20 via-red-950/0 to-transparent animate-pulse" />
          
          <div className="relative z-10 w-full max-w-sm bg-neutral-900 border border-red-500/50 rounded-3xl p-6 shadow-2xl shadow-red-500/20 flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(239,68,68,0.5)] border border-red-500/40">
              <AlertTriangle size={48} className="text-red-500" strokeWidth={2.5} />
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-2 drop-shadow-md">Emergency SOS</h2>
              <p className="text-sm text-red-200/80 font-medium px-4">
                Siren activated. What would you like to do?
              </p>
            </div>

            <div className="w-full space-y-3 mt-4">
              <a
                href="tel:112"
                onClick={() => speak("Opening phone dialer.", true)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-red-600/30"
              >
                <PhoneCall size={20} /> Dial 112 (Demo)
              </a>
              
              <button
                onClick={handleShareLocation}
                disabled={sharingLocation}
                className="w-full bg-neutral-800 border border-red-500/30 hover:bg-neutral-700 disabled:opacity-70 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                {sharingLocation ? (
                  <Loader2 className="animate-spin text-red-400" size={20} />
                ) : (
                  <MapPin size={20} className="text-red-400" />
                )}
                {sharingLocation ? "Locating..." : "Share Live Location"}
              </button>
              
              <button
                onClick={handleCloseSOS}
                className="w-full bg-transparent border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 font-semibold py-3.5 rounded-xl flex items-center justify-center transition-all mt-6 active:scale-[0.98]"
              >
                Stop Siren & Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CAMERA ASSISTANT OVERLAY
      ══════════════════════════════════════════════════════ */}
      {cameraMode && !sosActive && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black"
          role="region"
          aria-label="Camera assistant for object detection"
        >
          {/* ── Video + Canvas stacked ── */}
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden="true"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: "cover" }}
              aria-hidden="true"
            />

            {(permissionState === "idle" || permissionState === "requesting" || permissionState === "denied") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 p-8 gap-6">
                <div
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 shadow-2xl ${
                    permissionState === "denied"
                      ? "bg-red-500/10 border-red-500/40 shadow-red-500/20"
                      : "bg-indigo-500/10 border-indigo-500/40 shadow-indigo-500/20"
                  }`}
                >
                  <Camera
                    size={36}
                    className={permissionState === "denied" ? "text-red-400" : "text-indigo-400"}
                    aria-hidden="true"
                  />
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-white font-bold text-lg tracking-tight">
                    {permissionState === "denied" ? "Camera Permission Denied" : "Camera Access Required"}
                  </h2>
                  <p className="text-neutral-400 text-sm max-w-xs leading-relaxed">
                    {permissionState === "denied"
                      ? "You've blocked camera access. To use the camera assistant, please update your browser settings:"
                      : "The camera assistant needs access to your device camera to detect and announce objects around you."}
                  </p>
                </div>

                {permissionState === "denied" && (
                  <div className="w-full max-w-xs rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-2.5 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      How to fix
                    </p>
                    {["Tap the 🔒 lock icon in your browser's address bar", 'Find "Camera" and set it to "Allow"', 'Tap "Try Again" below'].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-neutral-300 text-xs leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="w-full max-w-xs space-y-3">
                  <button
                    onClick={requestPermissionAndStart}
                    disabled={permissionState === "requesting"}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/30"
                  >
                    {permissionState === "requesting" ? (
                      <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Requesting…</>
                    ) : (
                      <><Camera size={16} aria-hidden="true" /> {permissionState === "denied" ? "Try Again" : "Allow Camera Access"}</>
                    )}
                  </button>

                  <button
                    onClick={toggleCameraMode}
                    className="w-full py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 hover:text-neutral-200 transition-all active:scale-[0.98]"
                  >
                    <X size={15} aria-hidden="true" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {permissionState === "granted" && modelLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-4">
                <Loader2 size={44} className="animate-spin text-indigo-400" aria-hidden="true" />
                <p className="text-white font-semibold text-sm">Loading detection model…</p>
                <p className="text-neutral-400 text-xs">This only happens once</p>
              </div>
            )}

            {cameraError && permissionState === "granted" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <X size={28} className="text-red-400" aria-hidden="true" />
                </div>
                <p className="text-red-300 text-center font-medium text-sm max-w-xs">{cameraError}</p>
                <button
                  onClick={toggleCameraMode}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 text-sm font-semibold hover:bg-neutral-700 transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            )}

            {permissionState === "granted" && !modelLoading && !cameraError && (
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
                <div className="flex items-center gap-2.5 pointer-events-auto">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-md shadow-red-500/50" />
                  <span className="text-white text-xs font-bold uppercase tracking-widest">Live Detection</span>
                </div>
                <button
                  onClick={toggleCameraMode}
                  className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90 backdrop-blur-sm"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {permissionState !== "granted" && (
              <button
                onClick={toggleCameraMode}
                className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800/80 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all active:scale-90 backdrop-blur-sm"
              >
                <X size={17} />
              </button>
            )}

            {permissionState === "granted" && !modelLoading && !cameraError && (
              <div className="absolute inset-[20%] pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-indigo-400/60 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-indigo-400/60 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-indigo-400/60 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-indigo-400/60 rounded-br" />
              </div>
            )}
          </div>

          <div className="bg-neutral-950/95 border-t border-neutral-800 backdrop-blur-xl p-4 space-y-3.5 pb-safe-bottom">
            <div className="flex items-center gap-2">
              <ScanEye size={14} className="text-indigo-400" aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Detected Objects</p>
            </div>

            <div className="min-h-[36px] flex flex-wrap gap-2" aria-live="polite">
              {detectedObjects.length > 0 ? (
                [...new Set(detectedObjects)].map((obj, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                    {obj}
                  </span>
                ))
              ) : (
                <p className="text-neutral-600 text-xs font-medium">
                  {permissionState !== "granted" ? "Waiting for camera permission…" : modelLoading ? "Initializing model…" : "Scanning environment…"}
                </p>
              )}
            </div>

            <button
              onClick={toggleCameraMode}
              className="w-full py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-neutral-800 transition-all active:scale-[0.98]"
            >
              <EyeOff size={16} aria-hidden="true" />
              Disable Camera Assistant
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          FLOATING ACCESSIBILITY MENU
      ══════════════════════════════════════════════════════ */}
      {!cameraMode && !sosActive && (
        <div className="fixed bottom-6 right-4 z-40 flex flex-col items-end">
          {/* Menu Items Container */}
          <div 
            className={`flex flex-col items-end gap-3 mb-4 transition-all duration-300 ease-out origin-bottom ${
              isMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-8 pointer-events-none"
            }`}
          >
            {/* SOS Button */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-red-400 text-xs font-bold shadow-lg backdrop-blur-sm tracking-wide">
                SOS 112
              </span>
              <button
                onClick={() => { handleSOSClick(); setIsMenuOpen(false); }}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 transition-all active:scale-95 border border-red-500/50"
                aria-label="Emergency SOS. Calls emergency services."
              >
                <AlertTriangle size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Audio Guide Button */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 text-xs font-bold shadow-lg backdrop-blur-sm tracking-wide">
                Audio Guide
              </span>
              <button
                onClick={() => { readJourneySummary(); setIsMenuOpen(false); }}
                className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-all active:scale-95 border border-emerald-500/50"
                aria-label="Read journey route aloud"
              >
                <Volume2 size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Camera Assist Button */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-indigo-400 text-xs font-bold shadow-lg backdrop-blur-sm tracking-wide">
                Camera Assist
              </span>
              <button
                onClick={() => { toggleCameraMode(); setIsMenuOpen(false); }}
                className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 transition-all active:scale-95 border border-indigo-500/50"
                aria-label="Enable camera assistant for blind users"
              >
                <Camera size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Main FAB Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 border ${
              isMenuOpen 
                ? "bg-neutral-800 border-neutral-700 text-white rotate-45" 
                : "bg-white border-white text-neutral-950 shadow-white/10"
            }`}
            aria-label="Toggle accessibility menu"
            aria-expanded={isMenuOpen}
          >
            <Plus size={24} className="transition-transform" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MAIN PAGE
      ══════════════════════════════════════════════════════ */}
      <main className="relative min-h-[100dvh] w-full bg-neutral-950 p-4 sm:p-6 font-[family-name:var(--font-geist-sans)] overflow-hidden">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-md space-y-6 z-10 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-8">
          <div className="relative flex items-center justify-center mb-6 mt-2">
            <Link
              href="/"
              className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all backdrop-blur-md shadow-sm active:scale-95"
            >
              <Home size={18} />
            </Link>

            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="inline-flex items-center justify-center p-2.5 bg-neutral-900 border border-neutral-800 rounded-2xl mb-1 shadow-lg">
                <Ticket size={22} className="text-indigo-400" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Digital Pass</h1>
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-500/80" /> Verified by TravelNest
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

            <div className="flex items-center justify-center gap-2 bg-indigo-500/10 border-b border-neutral-800/80 px-6 py-3">
              <QrCode size={16} className="text-indigo-400" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Scan to Travel</h2>
            </div>

            <div className="p-6 text-center">
              {qrLegs.length > 0 ? (
                <div className="relative mb-6">
                  <div
                    ref={carouselRef}
                    className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-4 scrollbar-hide scroll-smooth"
                  >
                    {qrLegs.map((leg: any, idx: number) => (
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
                          {leg.source} <ArrowRight size={12} className="text-neutral-600" /> {leg.destination}
                        </p>

                        <div className="mx-auto flex aspect-square w-full max-w-[200px] items-center justify-center rounded-xl p-2 border-4 border-neutral-800 shadow-md">
                          {leg.travelPass?.qrData ? (
                            <img src={leg.travelPass.qrData as string} alt="Leg Travel Pass" className="h-full w-full rounded-lg object-contain" />
                          ) : (
                            <p className="text-sm text-zinc-500">Generating QR…</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {qrLegs.length > 1 && (
                    <div className="mt-2 flex justify-center gap-1.5">
                      {qrLegs.map((_: any, idx: number) => (
                        <span key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? "w-4 bg-indigo-400" : "w-1.5 bg-neutral-700"}`} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 text-xs font-medium text-neutral-500 uppercase tracking-widest">No QR passes required for this journey.</div>
              )}

              <div className="inline-flex items-center justify-center gap-4 text-xs font-semibold text-neutral-300 bg-neutral-950/50 px-5 py-2.5 rounded-xl border border-neutral-800/80">
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-400" />{journey.totalTime} mins</span>
                <div className="w-[1px] h-3 bg-neutral-700" />
                <span className="flex items-center gap-1.5"><IndianRupee size={14} className="text-emerald-400" />{journey.totalCost} Total</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2 mb-5">
              <Footprints size={14} className="text-neutral-400" />
              <h2 className="text-[10px] font-bold tracking-widest uppercase text-neutral-300">Journey Timeline</h2>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-y-4 before:left-[11px] before:w-[2px] before:bg-neutral-800/80">
              {journey.legs.map((leg: any, idx: number) => (
                <div key={idx} className="relative pl-8 flex justify-between items-center group">
                  <div className="absolute left-[7px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-neutral-950 border-2 border-neutral-600 group-hover:border-indigo-400 transition-colors z-10" />
                  <div className="w-full rounded-xl bg-neutral-950/50 border border-neutral-800/80 p-3.5 shadow-sm group-hover:border-neutral-700 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="inline-block rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300">{leg.mode}</span>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Step {idx + 1}</span>
                    </div>
                    <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5 truncate">
                      {leg.source} <ArrowRight size={10} className="text-neutral-600 shrink-0" /> {leg.destination}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 shadow-lg backdrop-blur-md">
            <div className="mb-3 flex items-center gap-2">
              <MapIcon size={14} className="text-neutral-400" />
              <h2 className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">Route Overview</h2>
            </div>
            <div className="h-48 w-full overflow-hidden rounded-xl border border-neutral-800 shadow-inner relative z-0">
              <Map legs={journey.legs} />
              <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-xl" />
            </div>
          </div>

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
    </>
  );
}