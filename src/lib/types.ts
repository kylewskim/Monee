export const CATEGORY_LETTERS = ["F", "S", "C", "P", "O"] as const;
export type CategoryLetter = (typeof CATEGORY_LETTERS)[number];

export const CATEGORIES: Record<
  CategoryLetter,
  { name: string; bgColor: string; textColor: string; borderColor: string; barColor: string }
> = {
  F: {
    name: "Food",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-300",
    barColor: "bg-green-400",
  },
  S: {
    name: "Subscription",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-300",
    barColor: "bg-blue-400",
  },
  C: {
    name: "Chulsu",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    borderColor: "border-purple-300",
    barColor: "bg-purple-400",
  },
  P: {
    name: "Personal",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    borderColor: "border-orange-300",
    barColor: "bg-orange-400",
  },
  O: {
    name: "Others",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    borderColor: "border-gray-300",
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
