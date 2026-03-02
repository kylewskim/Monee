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
      <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <span className={`text-lg font-semibold tabular-nums ${accent ? "text-white" : negative ? "text-red-500" : "text-gray-900"}`}>
        ${fmt(value)}
      </span>
    </div>
  );
}

export default function BudgetSummary({ budget, used, left }: BudgetSummaryProps) {
  return (
    <div className="flex gap-2">
      <StatCard label="Budget" value={budget} accent />
      <StatCard label="Used" value={used} />
      <StatCard label="Left" value={left} negative={left < 0} />
    </div>
  );
}
