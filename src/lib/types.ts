export const CATEGORY_LETTERS = ["F", "S", "C", "P", "O"] as const;
export type CategoryLetter = (typeof CATEGORY_LETTERS)[number];

export const CATEGORIES: Record<
  CategoryLetter,
  { name: string; color: string; textColor: string }
> = {
  F: { name: "Food",         color: "#AAE3CC", textColor: "#1c5e42" },
  S: { name: "Subscription", color: "#C5DBFB", textColor: "#1a3d8a" },
  C: { name: "Chulsu",       color: "#EFD0DD", textColor: "#7a2d4c" },
  P: { name: "Personal",     color: "#FFE4CA", textColor: "#7c3a08" },
  O: { name: "Others",       color: "#EFEFEF", textColor: "#404040" },
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
