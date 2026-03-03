"use client";

import { CATEGORIES, type CategoryLetter } from "@/lib/types";

interface CategoryBadgeProps {
  letter: CategoryLetter;
  showName?: boolean;
  size?: "sm" | "md";
}

export default function CategoryBadge({
  letter,
  showName = false,
  size = "sm",
}: CategoryBadgeProps) {
  const cat = CATEGORIES[letter];
  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass}`}
      style={{ backgroundColor: cat.color, color: cat.textColor }}
    >
      <span className="font-bold">{letter}</span>
      {showName && <span>{cat.name}</span>}
    </span>
  );
}
