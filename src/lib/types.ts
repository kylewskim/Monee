export const DEFAULT_DAILY_SLOT_LIMIT = 8;
export const MAX_CATEGORY_COUNT = 8;
export const META_SHEET_NAME = "_monee_meta";
export const TEMPLATE_SHEET_NAME = "Template";
export const MONEE_SCHEMA_VERSION = "1";

export const CATEGORY_COLOR_PALETTE = [
  "#F4CCCC",
  "#FCE5CD",
  "#FFF2CC",
  "#D9EAD3",
  "#D0E0E3",
  "#C9DAF8",
  "#D9D2E9",
  "#EFEFEF",
] as const;

export interface SetupCategoryInput {
  name: string;
  colorHex: string;
}

export interface CategoryConfig {
  order: number;
  code: string;
  name: string;
  colorHex: string;
  active: boolean;
}

export interface MoneeConfig {
  budget: number;
  slotLimit: number;
  categories: CategoryConfig[];
}

export interface CategorySummary {
  code: string;
  name: string;
  total: number;
  colorHex: string;
}

export interface MonthlySummary {
  month: string;
  budget: number;
  used: number;
  left: number;
  categories: CategorySummary[];
  spreadsheetUrl: string;
  slotLimit: number;
}

export type BootstrapReason = "NO_SHEET" | "INVALID_SHEET" | "MISSING_META";

export interface BootstrapReadyResponse {
  status: "ready";
  spreadsheetId: string;
  spreadsheetUrl: string;
  config: MoneeConfig;
  currentMonth: string;
}

export interface BootstrapNeedsSetupResponse {
  status: "needs_setup";
  reason: BootstrapReason;
}

export type BootstrapResponse =
  | BootstrapReadyResponse
  | BootstrapNeedsSetupResponse;
