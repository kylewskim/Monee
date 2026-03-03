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
      className={`flex-1 rounded-xl px-3 py-3 flex flex-col gap-1 ${
        highlight ? "bg-gray-900" : "bg-white border border-gray-200"
      }`}
    >
      <span
        className={`text-xs font-medium uppercase tracking-widest ${
          highlight ? "text-gray-400" : "text-gray-400"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-xl font-medium tabular-nums ${
          highlight
            ? "text-white"
            : negative
            ? "text-red-500"
            : "text-gray-900"
        }`}
      >
        ${fmt(value)}
      </span>
    </div>
  );
}

export default function BudgetSummary({ budget, used, left }: BudgetSummaryProps) {
  return (
    <div className="flex gap-2">
      <StatCard label="Budget" value={budget} />
      <StatCard label="Used" value={used} />
      <StatCard label="Left" value={left} negative={left < 0} />
    </div>
  );
}
