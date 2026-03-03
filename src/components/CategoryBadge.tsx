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
  const sizeClass = size === "md" ? "w-7 h-7 text-sm" : "w-5 h-5 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold flex-shrink-0 ${sizeClass}`}
      style={{ backgroundColor: cat.color, color: cat.textColor }}
    >
      {letter}
      {showName && <span className="ml-1 font-medium">{cat.name}</span>}
    </span>
  );
}
