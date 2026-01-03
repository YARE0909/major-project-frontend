"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { LogIn } from "lucide-react";

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
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 rounded-xl bg-zinc-900 border border-zinc-800">
        <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <LogIn size={20} /> Login
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </main>
  );
}
