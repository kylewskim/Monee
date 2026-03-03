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
    <div className="bg-white border px-2 py-2 border-gray-200 rounded-xl overflow-hidden">
      {categories.map((cat, i) => {
        const pct = used > 0 ? Math.min((cat.total / used) * 100, 100) : 0;
        const info = CATEGORIES[cat.letter];

        return (
          <div
            key={cat.letter}
            className={`flex items-center gap-3 px-2 py-1 ${
              i < categories.length - 1 ? "border-" : ""
            }`}
          >
            {/* Color dot */}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: info.color }}
            />

            {/* Name */}
            <span className="text-sm text-gray-900 font-medium w-24x flex-shrink-0">
              {cat.name}
            </span>

            {/* Amount */}
            <span className="text-sm text-gray-500 tabular-nums font-medium ml-auto flex-shrink-0">
              ${fmt(cat.total)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
