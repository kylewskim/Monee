"use client";

import { CATEGORIES, type CategorySummary } from "@/lib/types";

interface CategoryBreakdownProps {
  categories: CategorySummary[];
  used: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function CategoryBreakdown({ categories, used }: CategoryBreakdownProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {categories.map((cat, i) => {
        const pct = used > 0 ? Math.min((cat.total / used) * 100, 100) : 0;
        const info = CATEGORIES[cat.letter];

        return (
          <div
            key={cat.letter}
            className={`flex items-center gap-3 px-4 py-3 ${info.bgColor} ${
              i < categories.length - 1 ? "border-b border-white/60" : ""
            }`}
          >
            {/* Color dot */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${info.barColor}`} />

            {/* Name */}
            <span className={`text-sm font-medium w-24 flex-shrink-0 ${info.textColor}`}>
              {cat.name}
            </span>

            {/* Progress bar */}
            <div className="flex-1 h-1 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${info.barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Amount */}
            <span className={`text-sm tabular-nums font-semibold w-16 text-right flex-shrink-0 ${info.textColor}`}>
              ${fmt(cat.total)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
