"use client";

import { getContrastingTextColor } from "@/lib/colors";

interface CategoryBadgeProps {
  code: string;
  colorHex: string;
  showName?: boolean;
  name?: string;
  size?: "sm" | "md";
}

export default function CategoryBadge({
  code,
  colorHex,
  showName = false,
  name,
  size = "sm",
}: CategoryBadgeProps) {
  const sizeClass = size === "md" ? "w-7 h-7 text-sm" : "w-5 h-5 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold flex-shrink-0 ${sizeClass}`}
      style={{ backgroundColor: colorHex, color: getContrastingTextColor(colorHex) }}
    >
      {code}
      {showName && name && <span className="ml-1 font-medium">{name}</span>}
    </span>
  );
}
