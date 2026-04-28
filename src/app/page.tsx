"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setToken, getToken } from "@/lib/auth";
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  ArrowRight
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isLogin = mode === "login";

  // ── Redirect if already logged in ──
  useEffect(() => {
    // If you don't have getToken exported, you can use: localStorage.getItem("token")
    const token = getToken ? getToken() : null; 
    
    if (token) {
      router.push("/journey");
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post("/auth/login", {
          email,
          password,
        });

        setToken(res.data.token);
        router.push("/journey");
      } else {
        await api.post("/auth/signup", {
          email,
          password,
        });

        setSuccess("Account created successfully. Please sign in.");
        setMode("login");
        setPassword("");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          (isLogin ? "Login failed" : "Signup failed")
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setError(null);
    setSuccess(null);
    setPassword("");
  };

  // Prevent flashing the login form while checking auth status
  if (isCheckingAuth) {
    return (
      <main className="min-h-[100dvh] w-full flex items-center justify-center bg-neutral-950">
        <span className="w-8 h-8 rounded-full border-4 border-neutral-800 border-t-indigo-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center bg-neutral-950 p-4 sm:p-6 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      
      {/* ── Ambient Background Glows ── */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-8 duration-500 group">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none rounded-3xl" />

        {/* ── Header ── */}
        <div className="mb-8 flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-neutral-900 border border-neutral-800 rounded-2xl mb-4 shadow-lg">
            {isLogin ? (
              <LogIn size={24} className="text-indigo-400" />
            ) : (
              <UserPlus size={24} className="text-indigo-400" />
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>

          <p className="mt-2 text-[11px] font-medium text-neutral-500 uppercase tracking-widest">
            {isLogin
              ? "Sign in to continue your journey"
              : "Join TravelNest and start exploring"}
          </p>
        </div>

        {/* ── Form ── */}
        <div className="space-y-4 relative z-10">
          {/* Email */}
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 rounded-xl bg-neutral-950 border border-neutral-800 pl-11 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 rounded-xl bg-neutral-950 border border-neutral-800 pl-11 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-xs font-medium text-red-400 text-center leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs font-medium text-emerald-400 text-center leading-relaxed">
                {success}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="mt-2 w-full h-14 rounded-xl font-bold text-sm bg-white text-black hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-neutral-400 border-t-black animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight size={16} className="text-neutral-800" />
              </>
            )}
          </button>
        </div>

        {/* ── Switcher ── */}
        <div className="mt-6 border-t border-neutral-800/80 pt-6 relative z-10">
          <button
            onClick={switchMode}
            className="w-full flex items-center justify-center text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-neutral-600 font-bold uppercase tracking-widest relative z-10">
          TravelNest Intelligence
        </p>
      </div>
    </main>
  );
}