export const CATEGORY_LETTERS = ["F", "S", "C", "P", "O"] as const;
export type CategoryLetter = (typeof CATEGORY_LETTERS)[number];

export const CATEGORIES: Record<
  CategoryLetter,
  { name: string; badgeBg: string; badgeText: string; barColor: string }
> = {
  F: {
    name: "Food",
    badgeBg: "bg-green-900/40",
    badgeText: "text-green-300",
    barColor: "bg-green-500",
  },
  S: {
    name: "Subscription",
    badgeBg: "bg-blue-900/40",
    badgeText: "text-blue-300",
    barColor: "bg-blue-500",
  },
  C: {
    name: "Chulsu",
    badgeBg: "bg-purple-900/40",
    badgeText: "text-purple-300",
    barColor: "bg-purple-500",
  },
  P: {
    name: "Personal",
    badgeBg: "bg-orange-900/40",
    badgeText: "text-orange-300",
    barColor: "bg-orange-500",
  },
  O: {
    name: "Others",
    badgeBg: "bg-zinc-700/60",
    badgeText: "text-zinc-300",
    barColor: "bg-zinc-400",
  },
};

export interface CategorySummary {
  letter: CategoryLetter;
  name: string;
  total: number;
}

export interface MonthlySummary {
  month: string;
  budget: number;
  used: number;
  left: number;
  categories: CategorySummary[];
}
