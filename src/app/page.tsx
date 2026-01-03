import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">TravelNest</h1>
      <p className="text-zinc-400 text-center max-w-md">
        Unified multimodal journey planning and booking platform
      </p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700"
        >
          Login
        </Link>

        <Link
          href="/journey"
          className="px-6 py-3 rounded border border-zinc-700 hover:bg-zinc-800"
        >
          Plan Journey
        </Link>
      </div>
    </main>
  );
}
