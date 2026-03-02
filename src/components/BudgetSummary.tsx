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
  accent?: boolean;
  negative?: boolean;
}

function StatCard({ label, value, accent, negative }: StatCardProps) {
  return (
    <div className={`flex-1 rounded-2xl p-4 flex flex-col gap-1 border ${accent ? "bg-black border-black" : "bg-white border-gray-200"}`}>
      <span className={`text-xs font-medium uppercase tracking-widest ${accent ? "text-gray-400" : "text-gray-400"}`}>
        {label}
      </span>
      <span className={`text-2xl font-bold tabular-nums ${accent ? "text-white" : negative ? "text-red-500" : "text-gray-900"}`}>
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
        <StatCard label="Budget" value={budget} accent />
        <StatCard label="Used" value={used} />
        <StatCard label="Left" value={left} negative={left < 0} />
      </div>

      {/* Progress bar */}
      <div className="rounded-full h-1.5 bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            usedPct >= 100 ? "bg-red-500" : usedPct >= 80 ? "bg-yellow-400" : "bg-black"
          }`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right">{usedPct.toFixed(0)}% used</p>
    </div>
  );
}
