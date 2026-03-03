"use client";

interface BudgetSummaryProps {
  budget: number;
  used: number;
  left: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

interface StatCardProps {
  label: string;
  value: number;
  highlight?: boolean;
  negative?: boolean;
}

function StatCard({ label, value, highlight, negative }: StatCardProps) {
  return (
    <div
      className={`flex-1 rounded-2xl p-4 flex flex-col gap-1 ${
        highlight ? "bg-white" : "bg-zinc-900 border border-zinc-800"
      }`}
    >
      <span
        className={`text-xs font-medium uppercase tracking-widest ${
          highlight ? "text-zinc-400" : "text-zinc-500"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-2xl font-bold tabular-nums ${
          highlight
            ? "text-black"
            : negative
            ? "text-red-400"
            : "text-white"
        }`}
      >
        ${fmt(value)}
      </span>
    </div>
  );
}

export default function BudgetSummary({ budget, used, left }: BudgetSummaryProps) {
  const usedPct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <StatCard label="Budget" value={budget} highlight />
        <StatCard label="Used" value={used} />
        <StatCard label="Left" value={left} negative={left < 0} />
      </div>

      {/* Progress bar */}
      <div className="rounded-full h-1.5 bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            usedPct >= 100 ? "bg-red-500" : usedPct >= 80 ? "bg-yellow-500" : "bg-white"
          }`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 text-right">{usedPct.toFixed(0)}% used</p>
    </div>
  );
}
