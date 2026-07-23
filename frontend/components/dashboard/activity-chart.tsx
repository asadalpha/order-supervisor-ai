"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";

interface ActivityPoint {
  time: string;
  events: number;
  actions: number;
}

const DEMO_DATA: ActivityPoint[] = [
  { time: "00:00", events: 12, actions: 4 },
  { time: "04:00", events: 18, actions: 7 },
  { time: "08:00", events: 45, actions: 19 },
  { time: "12:00", events: 82, actions: 34 },
  { time: "16:00", events: 64, actions: 28 },
  { time: "20:00", events: 95, actions: 42 },
  { time: "24:00", events: 110, actions: 51 },
];

export function ActivityChart({
  totalEvents = 110,
  totalActions = 51,
}: {
  totalEvents?: number;
  totalActions?: number;
}) {
  const [activeRange, setActiveRange] = useState<"24h" | "7d" | "30d">("24h");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate SVG path for line and area fill
  const width = 500;
  const height = 160;
  const padding = 20;

  const maxVal = Math.max(...DEMO_DATA.map((d) => d.events), 120);

  const points = DEMO_DATA.map((d, i) => {
    const x = padding + (i / (DEMO_DATA.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.events / maxVal) * (height - padding * 2);
    return { x, y, data: d };
  });

  const linePath = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    "",
  );

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const hovered = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <Card className="flex flex-col p-5 bg-[#111118] border-[#1e1e2a] rounded-2xl">
      <div className="flex items-center justify-between pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-text-dim font-medium">
              System Throughput
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-3 w-3" />
              +24% increase
            </span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <h3 className="text-2xl font-bold text-text">{totalEvents}</h3>
            <span className="text-xs text-text-muted">Total Events Processed</span>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[#1e1e2a] bg-[#09090d] p-1">
          {(["24h", "7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                activeRange === r
                  ? "bg-[#1e1e2a] text-text shadow-sm"
                  : "text-text-dim hover:text-text"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Graphic */}
      <div className="relative w-full pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-40 overflow-visible"
        >
          <defs>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#1e1e2a"
            strokeDasharray="4 4"
          />
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="#1e1e2a"
            strokeDasharray="4 4"
          />

          {/* Area Fill */}
          <path d={areaPath} fill="url(#emeraldGradient)" />

          {/* Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 5 : 3}
              className="cursor-pointer transition-all"
              fill={hoveredIndex === i ? "#34d399" : "#10b981"}
              stroke="#09090d"
              strokeWidth="2"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip display */}
        {hovered && (
          <div className="mt-2 flex items-center justify-between text-xs border-t border-[#1e1e2a] pt-3 text-text-muted">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Timeframe: <strong className="text-text">{hovered.data.time}</strong>
            </span>
            <div className="flex gap-4">
              <span>Events: <strong className="text-emerald-400">{hovered.data.events}</strong></span>
              <span>Actions: <strong className="text-purple-400">{hovered.data.actions}</strong></span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
