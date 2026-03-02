"use client";

import { CATEGORIES, type CategoryLetter } from "@/lib/types";

interface CategoryBadgeProps {
  letter: CategoryLetter;
  size?: "sm" | "md";
}

export default function CategoryBadge({ letter, size = "sm" }: CategoryBadgeProps) {
  const cat = CATEGORIES[letter];
  const sizeClass = size === "md" ? "w-7 h-7 text-sm" : "w-6 h-6 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClass} ${cat.bgColor} ${cat.textColor}`}
    >
      {letter}
    </span>
  );
}
