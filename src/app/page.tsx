"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  ArrowRightLeft,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

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

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-black via-zinc-950 to-zinc-900">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl shadow-xl">
        {/* Accent Strip */}
        <div className="absolute inset-x-0 top-0 h-0.75 rounded-t-2xl bg-linear-to-r from-orange-500 via-orange-400 to-orange-600" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              {isLogin ? <LogIn size={22} /> : <UserPlus size={22} />}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>

            <p className="mt-1 text-sm text-zinc-400">
              {isLogin
                ? "Sign in to continue your journey"
                : "Join TravelNest and start exploring"}
            </p>
          </div>

          {/* Switcher */}
          <div className="mb-6">
            <button
              onClick={switchMode}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 py-2.5 text-sm text-zinc-300 hover:border-orange-500/40 hover:text-white transition cursor-pointer"
            >
              <ArrowRightLeft size={16} />
              {isLogin
                ? "Need an account? Switch to Sign up"
                : "Already have an account? Switch to Login"}
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-zinc-800/60 border border-zinc-700/60 pl-10 pr-4 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-zinc-800/60 border border-zinc-700/60 pl-10 pr-4 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Success */}
            {success && (
              <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-black hover:bg-orange-400 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {loading
                ? isLogin
                  ? "Signing in…"
                  : "Creating account…"
                : isLogin
                ? "Sign in"
                : "Create account"}
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-zinc-500 font-bold">
            TravelNest • Unified Multimodal Travel
          </p>
        </div>
      </div>
    </main>
  );
}