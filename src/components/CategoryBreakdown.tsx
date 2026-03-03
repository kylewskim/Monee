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
            className={`flex items-center gap-3 px-4 py-3 ${
              i < categories.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            {/* Color dot */}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: info.color }}
            />

            {/* Name */}
            <span className="text-sm text-gray-900 font-medium w-24 flex-shrink-0">
              {cat.name}
            </span>

            {/* Progress bar */}
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: info.color }}
              />
            </div>

            {/* Amount */}
            <span className="text-sm text-gray-500 tabular-nums font-medium w-16 text-right flex-shrink-0">
              ${fmt(cat.total)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
