"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { JourneyRoute } from "@/types/journey";

type Props = {
  routes: JourneyRoute[];
};

export default function RouteComparisonChart({ routes }: Props) {
  if (!routes || routes.length === 0) return null;

  const data = routes.map((r, idx) => ({
    name: r.name || `Route ${idx + 1}`,
    cost: r.totalCost,
    time: r.totalTime,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Cost Chart */}
      <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
        <h3 className="text-lg font-semibold mb-4">Cost Comparison (₹)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip />
            <Bar dataKey="cost" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Time Chart */}
      <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
        <h3 className="text-lg font-semibold mb-4">Time Comparison (mins)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip />
            <Bar dataKey="time" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
