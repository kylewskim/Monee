export const CATEGORY_LETTERS = ["F", "S", "C", "P", "O"] as const;
export type CategoryLetter = (typeof CATEGORY_LETTERS)[number];

export const CATEGORIES: Record<
  CategoryLetter,
  { name: string; badgeBg: string; badgeText: string; barColor: string }
> = {
  F: {
    name: "Food",
    badgeBg: "bg-green-100",
    badgeText: "text-green-800",
    barColor: "bg-green-400",
  },
  S: {
    name: "Subscription",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    barColor: "bg-blue-400",
  },
  C: {
    name: "Chulsu",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
    barColor: "bg-purple-400",
  },
  P: {
    name: "Personal",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-800",
    barColor: "bg-orange-400",
  },
  O: {
    name: "Others",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
    barColor: "bg-gray-400",
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
