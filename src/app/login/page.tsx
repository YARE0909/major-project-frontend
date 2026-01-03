"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { LogIn, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      setToken(res.data.token);
      router.push("/journey");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-black via-zinc-950 to-zinc-900">
      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl shadow-xl">
        
        {/* Accent strip */}
        <div className="absolute inset-x-0 top-0 h-0.75 rounded-t-2xl bg-linear-to-r from-orange-500 via-orange-400 to-orange-600" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <LogIn size={22} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Sign in to continue your journey
            </p>
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
                className="w-full rounded-xl bg-zinc-800/60 border border-zinc-700/60 pl-10 pr-4 py-3 text-sm
                           placeholder-zinc-500 focus:outline-none focus:border-orange-500/60
                           focus:ring-2 focus:ring-orange-500/20 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="w-full rounded-xl bg-zinc-800/60 border border-zinc-700/60 pl-10 pr-4 py-3 text-sm
                           placeholder-zinc-500 focus:outline-none focus:border-orange-500/60
                           focus:ring-2 focus:ring-orange-500/20 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* CTA */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-orange-500 py-3 text-sm font-medium text-black
                         hover:bg-orange-400 active:scale-[0.98]
                         disabled:opacity-60 disabled:pointer-events-none
                         transition-all"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-zinc-500">
            TravelNest • Unified Multimodal Travel
          </p>
        </div>
      </div>
    </main>
  );
}
