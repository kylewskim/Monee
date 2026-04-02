import type { sheets_v4 } from "googleapis";
import {
  CATEGORY_COLOR_PALETTE,
  DEFAULT_DAILY_SLOT_LIMIT,
  MAX_CATEGORY_COUNT,
  META_SHEET_NAME,
  MONEE_SCHEMA_VERSION,
  TEMPLATE_SHEET_NAME,
  type BootstrapReason,
  type CategoryConfig,
  type MoneeConfig,
  type SetupCategoryInput,
} from "@/lib/types";
import {
  getDriveClient,
  getSheetsClient,
  readSheetRange,
  writeSheetRange,
} from "@/lib/googleSheets";

const TEMPLATE_SPREADSHEET_ID = process.env.GOOGLE_TEMPLATE_SPREADSHEET_ID;
const DEFAULT_APP_TIME_ZONE = process.env.APP_TIME_ZONE || "America/Los_Angeles";

const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_ROWS = [3, 13, 23, 33, 43, 53] as const;
const DAY_START_COLS = [4, 7, 10, 13, 16, 19, 22] as const; // D,G,J,M,P,S,V
const CATEGORY_COLS = ["E", "H", "K", "N", "Q", "T", "W"] as const;
const AMOUNT_COLS = ["F", "I", "L", "O", "R", "U", "X"] as const;
const CATEGORY_LABEL_START_ROW = 8;
const CATEGORY_LABEL_END_ROW = 15;
const CATEGORY_LABEL_COL = "B";

const CATEGORY_NAME_PATTERN = /^[A-Za-z][A-Za-z ]*$/;
const CATEGORY_HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const ALLOWED_CATEGORY_COLORS = new Set(
  CATEGORY_COLOR_PALETTE.map((color) => color.toUpperCase())
);

interface ManagedSpreadsheetFile {
  id: string;
  webViewLink?: string | null;
}

export interface SpreadsheetContext {
  spreadsheetId: string;
  spreadsheetUrl: string;
  config: MoneeConfig;
}

export class SpreadsheetValidationError extends Error {
  readonly reason: BootstrapReason;

  constructor(reason: BootstrapReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

export function getMonthTabName(year: number, month: number): string {
  return `${MONTH_ABBRS[month]}${year}`;
}

function normalizeTimeZone(timeZone?: string | null): string {
  if (!timeZone) {
    return DEFAULT_APP_TIME_ZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_APP_TIME_ZONE;
  }
}

function getCurrentYearMonthInTimeZone(
  timeZone?: string | null,
  date = new Date()
): {
  year: number;
  month: number;
} {
  const safeTimeZone = normalizeTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone,
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    throw new Error(`Failed to resolve current month in time zone ${safeTimeZone}.`);
  }

  return { year, month };
}

export function getCurrentMonthTabName(timeZone?: string | null): string {
  const { year, month } = getCurrentYearMonthInTimeZone(timeZone);
  return getMonthTabName(year, month);
}

export function parseMonthTabName(tabName: string): { year: number; month: number } | null {
  const match = tabName.match(/^([A-Za-z]{3})(\d{4})$/);
  if (!match) return null;
  const month = MONTH_ABBRS.findIndex((m) => m === match[1]);
  if (month < 0) return null;
  const year = Number(match[2]);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return null;
  return { year, month };
}

function getSpreadsheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

function toA1(row: number, col: number): string {
  let colStr = "";
  let c = col;
  while (c > 0) {
    const rem = (c - 1) % 26;
    colStr = String.fromCharCode(65 + rem) + colStr;
    c = Math.floor((c - 1) / 26);
  }
  return `${colStr}${row}`;
}

function colLabelToIndex(col: string): number {
  let value = 0;
  for (const ch of col) {
    value = value * 26 + (ch.charCodeAt(0) - 64);
  }
  return value;
}

function parseNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function hexToRgbFraction(hex: string): { red: number; green: number; blue: number } {
  const clean = normalizeHex(hex).replace("#", "");
  const r = Number.parseInt(clean.slice(0, 2), 16) / 255;
  const g = Number.parseInt(clean.slice(2, 4), 16) / 255;
  const b = Number.parseInt(clean.slice(4, 6), 16) / 255;
  return { red: r, green: g, blue: b };
}

function normalizeHex(hex: string): string {
  const value = hex.trim().toUpperCase();
  if (!value.startsWith("#")) {
    return `#${value}`;
  }
  return value;
}

function getCategoryFormula(code: string): string {
  const chunks = AMOUNT_COLS.map((amountCol, idx) => {
    const catCol = CATEGORY_COLS[idx];
    return `IFERROR(FILTER(${amountCol}:${amountCol}, ${catCol}:${catCol} = "${code}"), 0)`;
  });
  return `=SUM(${chunks.join(",")})`;
}

function buildDateAnchorValues(year: number, month: number): Record<string, number | string> {
  const anchors: Record<string, number | string> = {};
  for (const row of DAY_ROWS) {
    for (const col of DAY_START_COLS) {
      anchors[toA1(row, col)] = "";
    }
  }

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const weekIndex = Math.floor((firstDow + day - 1) / 7);
    const dow = (firstDow + day - 1) % 7;
    const row = DAY_ROWS[weekIndex];
    const col = DAY_START_COLS[dow];
    anchors[toA1(row, col)] = day;
  }

  return anchors;
}

export function buildValidatedCategories(input: SetupCategoryInput[]): CategoryConfig[] {
  const categories = input
    .map((c) => ({
      name: String(c?.name ?? "").trim(),
      colorHex: normalizeHex(String(c?.colorHex ?? "")),
    }))
    .filter((c) => c.name.length > 0);

  if (categories.length < 1 || categories.length > MAX_CATEGORY_COUNT) {
    throw new Error(`Categories must be between 1 and ${MAX_CATEGORY_COUNT}.`);
  }

  const usedInitials = new Set<string>();
  const usedColors = new Set<string>();

  return categories.map((category, idx) => {
    if (!CATEGORY_NAME_PATTERN.test(category.name)) {
      throw new Error("Category names must be English letters and spaces, starting with a letter.");
    }
    if (!CATEGORY_HEX_PATTERN.test(category.colorHex)) {
      throw new Error("Category color must be a valid hex code.");
    }
    if (!ALLOWED_CATEGORY_COLORS.has(category.colorHex)) {
      throw new Error("Category color must be selected from the preset palette.");
    }

    const code = category.name[0].toUpperCase();
    if (usedInitials.has(code)) {
      throw new Error("Category first letters must be unique.");
    }
    usedInitials.add(code);

    if (usedColors.has(category.colorHex)) {
      throw new Error("Category colors must be unique.");
    }
    usedColors.add(category.colorHex);

    return {
      order: idx + 1,
      code,
      name: category.name,
      colorHex: category.colorHex,
      active: true,
    };
  });
}

function getMetaValues(config: MoneeConfig): Array<Array<string | number>> {
  const rows: Array<Array<string | number>> = [
    ["schemaVersion", MONEE_SCHEMA_VERSION, "", "", ""],
    ["slotLimit", config.slotLimit, "", "", ""],
    ["budget", config.budget, "", "", ""],
    ["", "", "", "", ""],
    ["order", "code", "name", "colorHex", "active"],
  ];

  for (let i = 0; i < MAX_CATEGORY_COUNT; i++) {
    const cat = config.categories[i];
    if (cat) {
      rows.push([cat.order, cat.code, cat.name, cat.colorHex, "TRUE"]);
    } else {
      rows.push(["", "", "", "", "FALSE"]);
    }
  }

  return rows;
}

function parseMetaValues(values: Array<Array<string | number>>): MoneeConfig {
  const schemaVersion = String(values?.[0]?.[1] ?? "").trim();
  if (schemaVersion !== MONEE_SCHEMA_VERSION) {
    throw new SpreadsheetValidationError("INVALID_SHEET", "Unsupported schema version.");
  }

  const slotLimit = parseNumber(values?.[1]?.[1]) || DEFAULT_DAILY_SLOT_LIMIT;
  const budget = parseNumber(values?.[2]?.[1]);

  const categories: CategoryConfig[] = [];
  const usedCodes = new Set<string>();
  const usedColors = new Set<string>();
  for (let i = 5; i <= 12; i++) {
    const row = values[i] ?? [];
    const order = parseNumber(row[0]);
    const code = String(row[1] ?? "").trim().toUpperCase();
    const name = String(row[2] ?? "").trim();
    const colorHex = normalizeHex(String(row[3] ?? "").trim());
    const active = String(row[4] ?? "").toUpperCase() === "TRUE";

    if (!active) continue;
    if (!order || !code || !name || !colorHex) {
      throw new SpreadsheetValidationError("INVALID_SHEET", "Invalid category metadata row.");
    }
    if (!CATEGORY_HEX_PATTERN.test(colorHex)) {
      throw new SpreadsheetValidationError("INVALID_SHEET", "Invalid category color in metadata.");
    }
    if (!ALLOWED_CATEGORY_COLORS.has(colorHex)) {
      throw new SpreadsheetValidationError("INVALID_SHEET", "Category color is outside allowed palette.");
    }
    if (usedCodes.has(code)) {
      throw new SpreadsheetValidationError("INVALID_SHEET", "Duplicate category code in metadata.");
    }
    if (usedColors.has(colorHex)) {
      throw new SpreadsheetValidationError("INVALID_SHEET", "Duplicate category color in metadata.");
    }
    usedCodes.add(code);
    usedColors.add(colorHex);

    categories.push({ order, code, name, colorHex, active: true });
  }

  if (!categories.length) {
    throw new SpreadsheetValidationError("INVALID_SHEET", "No active categories in metadata.");
  }

  return { budget, slotLimit, categories };
}

async function getSheetMap(
  accessToken: string,
  spreadsheetId: string
): Promise<Map<string, number>> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });

  const map = new Map<string, number>();
  for (const s of res.data.sheets ?? []) {
    const title = s.properties?.title;
    const id = s.properties?.sheetId;
    if (title && id != null) {
      map.set(title, id);
    }
  }
  return map;
}

async function findManagedSpreadsheet(accessToken: string): Promise<ManagedSpreadsheetFile | null> {
  const drive = getDriveClient(accessToken);

  const managed = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and appProperties has { key='moneeManaged' and value='true' }",
    pageSize: 10,
    orderBy: "modifiedTime desc",
    fields: "files(id,webViewLink)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const managedFile = managed.data.files?.[0];
  if (managedFile?.id) {
    return { id: managedFile.id, webViewLink: managedFile.webViewLink ?? undefined };
  }

  // Fallback by name for previously-created files.
  const fallback = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and name='Monee'",
    pageSize: 10,
    orderBy: "modifiedTime desc",
    fields: "files(id,webViewLink)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const fallbackFile = fallback.data.files?.[0];
  if (!fallbackFile?.id) {
    return null;
  }

  return { id: fallbackFile.id, webViewLink: fallbackFile.webViewLink ?? undefined };
}

export async function validateSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<MoneeConfig> {
  const map = await getSheetMap(accessToken, spreadsheetId);
  if (!map.has(TEMPLATE_SHEET_NAME)) {
    throw new SpreadsheetValidationError("INVALID_SHEET", "Template sheet is missing.");
  }
  if (!map.has(META_SHEET_NAME)) {
    throw new SpreadsheetValidationError("MISSING_META", "Metadata sheet is missing.");
  }

  const values = await readSheetRange(accessToken, spreadsheetId, META_SHEET_NAME, "A1:E13");
  return parseMetaValues(values);
}

export async function getManagedSpreadsheetContext(
  accessToken: string
): Promise<SpreadsheetContext> {
  const file = await findManagedSpreadsheet(accessToken);
  if (!file?.id) {
    throw new SpreadsheetValidationError("NO_SHEET", "No spreadsheet found.");
  }

  const config = await validateSpreadsheet(accessToken, file.id);

  return {
    spreadsheetId: file.id,
    spreadsheetUrl: file.webViewLink ?? getSpreadsheetUrl(file.id),
    config,
  };
}

async function ensureMetaSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  const map = await getSheetMap(accessToken, spreadsheetId);

  if (!map.has(META_SHEET_NAME)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: META_SHEET_NAME,
                hidden: true,
              },
            },
          },
        ],
      },
    });
    return;
  }

  const metaSheetId = map.get(META_SHEET_NAME)!;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId: metaSheetId, hidden: true },
            fields: "hidden",
          },
        },
      ],
    },
  });
}

async function rewriteMonthSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  config: MoneeConfig,
  year: number,
  month: number,
  sheetId: number
): Promise<void> {
  const sheets = getSheetsClient(accessToken);

  // Rewrite date anchors.
  const anchors = buildDateAnchorValues(year, month);
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: Object.entries(anchors).map(([cell, value]) => ({
        range: `'${tabName}'!${cell}:${cell}`,
        values: [[value]],
      })),
    },
  });

  // Rewrite summary formulas.
  await writeSheetRange(accessToken, spreadsheetId, tabName, "C4:C6", [
    [config.budget],
    ["=SUM(D12:X12,D22:X22,D32:X32,D42:X42,D52:X52,D62:X62)"],
    ["=C4-C5"],
  ]);

  // Rewrite categories and totals.
  const nameRows: Array<Array<string>> = [];
  const totalRows: Array<Array<string | number>> = [];
  for (let i = 0; i < MAX_CATEGORY_COUNT; i++) {
    const cat = config.categories[i];
    if (cat) {
      nameRows.push([cat.name]);
      totalRows.push([getCategoryFormula(cat.code)]);
    } else {
      nameRows.push([""]);
      totalRows.push([""]);
    }
  }

  await writeSheetRange(accessToken, spreadsheetId, tabName, "B8:B15", nameRows);
  await writeSheetRange(accessToken, spreadsheetId, tabName, "C8:C15", totalRows);

  // Reset and rebuild conditional formatting rules for active categories.
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: `sheets(properties(sheetId,title),conditionalFormats)` ,
  });

  const targetSheet = meta.data.sheets?.find((s) => s.properties?.sheetId === sheetId);
  const ruleCount = targetSheet?.conditionalFormats?.length ?? 0;

  const requests: sheets_v4.Schema$Request[] = [];

  for (let i = ruleCount - 1; i >= 0; i--) {
    requests.push({
      deleteConditionalFormatRule: {
        sheetId,
        index: i,
      },
    });
  }

  // Clear all category label backgrounds first (B8:B15), then color active ones only.
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: CATEGORY_LABEL_START_ROW - 1,
        endRowIndex: CATEGORY_LABEL_END_ROW,
        startColumnIndex: colLabelToIndex(CATEGORY_LABEL_COL) - 1,
        endColumnIndex: colLabelToIndex(CATEGORY_LABEL_COL),
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 1, green: 1, blue: 1 },
        },
      },
      fields: "userEnteredFormat.backgroundColor",
    },
  });

  config.categories.forEach((cat, idx) => {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: CATEGORY_LABEL_START_ROW - 1 + idx,
          endRowIndex: CATEGORY_LABEL_START_ROW + idx,
          startColumnIndex: colLabelToIndex(CATEGORY_LABEL_COL) - 1,
          endColumnIndex: colLabelToIndex(CATEGORY_LABEL_COL),
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: hexToRgbFraction(cat.colorHex),
          },
        },
        fields: "userEnteredFormat.backgroundColor",
      },
    });
  });

  const rowBlocks: Array<[number, number]> = [
    [0, 12],
    [13, 22],
    [23, 32],
    [33, 42],
    [43, 52],
    [53, 1015],
  ];

  config.categories.forEach((cat, idx) => {
    const ranges: sheets_v4.Schema$GridRange[] = CATEGORY_COLS.flatMap((col) => {
      const colIdx = colLabelToIndex(col) - 1;
      return rowBlocks.map(([start, end]) => ({
        sheetId,
        startRowIndex: start,
        endRowIndex: end,
        startColumnIndex: colIdx,
        endColumnIndex: colIdx + 1,
      }));
    });

    requests.push({
      addConditionalFormatRule: {
        index: idx,
        rule: {
          ranges,
          booleanRule: {
            condition: {
              type: "TEXT_EQ",
              values: [{ userEnteredValue: cat.code }],
            },
            format: {
              backgroundColor: hexToRgbFraction(cat.colorHex),
            },
          },
        },
      },
    });
  });

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }
}

async function clearInactiveCategoryRowsIfNeeded(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  activeCategoryCount: number
): Promise<void> {
  if (activeCategoryCount >= MAX_CATEGORY_COUNT) {
    return;
  }

  const startRow = CATEGORY_LABEL_START_ROW + activeCategoryCount;
  const endRow = CATEGORY_LABEL_END_ROW;
  if (startRow > endRow) {
    return;
  }

  const range = `${CATEGORY_LABEL_COL}${startRow}:C${endRow}`;
  const values = await readSheetRange(accessToken, spreadsheetId, tabName, range);
  const hasAnyValue = values.some((row) =>
    row.some((cell) => String(cell ?? "").trim() !== "")
  );

  if (!hasAnyValue) {
    return;
  }

  const blankRows = Array.from({ length: endRow - startRow + 1 }, () => ["", ""]);
  await writeSheetRange(accessToken, spreadsheetId, tabName, range, blankRows);
}

export async function ensureMonthSheet(
  accessToken: string,
  spreadsheetId: string,
  config: MoneeConfig,
  year: number,
  month: number
): Promise<string> {
  const tabName = getMonthTabName(year, month);
  const sheets = getSheetsClient(accessToken);
  const map = await getSheetMap(accessToken, spreadsheetId);

  if (map.has(tabName)) {
    await clearInactiveCategoryRowsIfNeeded(
      accessToken,
      spreadsheetId,
      tabName,
      config.categories.length
    );
    return tabName;
  }

  const templateSheetId = map.get(TEMPLATE_SHEET_NAME);
  if (templateSheetId == null) {
    throw new SpreadsheetValidationError("INVALID_SHEET", "Template sheet is missing.");
  }

  const duplicate = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          duplicateSheet: {
            sourceSheetId: templateSheetId,
            newSheetName: tabName,
          },
        },
      ],
    },
  });

  const newSheetId = duplicate.data.replies?.[0]?.duplicateSheet?.properties?.sheetId;
  if (newSheetId == null) {
    throw new Error("Failed to duplicate template sheet.");
  }

  await rewriteMonthSheet(accessToken, spreadsheetId, tabName, config, year, month, newSheetId);
  return tabName;
}

export async function bootstrapSpreadsheet(
  accessToken: string,
  timeZone?: string | null
): Promise<
  | {
      status: "ready";
      spreadsheetId: string;
      spreadsheetUrl: string;
      config: MoneeConfig;
      currentMonth: string;
    }
  | { status: "needs_setup"; reason: BootstrapReason }
> {
  try {
    const context = await getManagedSpreadsheetContext(accessToken);
    const now = getCurrentYearMonthInTimeZone(timeZone);
    const currentMonth = await ensureMonthSheet(
      accessToken,
      context.spreadsheetId,
      context.config,
      now.year,
      now.month
    );

    return {
      status: "ready",
      spreadsheetId: context.spreadsheetId,
      spreadsheetUrl: context.spreadsheetUrl,
      config: context.config,
      currentMonth,
    };
  } catch (err) {
    if (err instanceof SpreadsheetValidationError) {
      return { status: "needs_setup", reason: err.reason };
    }
    console.error("bootstrapSpreadsheet error", err);
    return { status: "needs_setup", reason: "INVALID_SHEET" };
  }
}

export async function setupSpreadsheet(
  accessToken: string,
  budget: number,
  categoryInputs: SetupCategoryInput[],
  timeZone?: string | null
): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
  config: MoneeConfig;
  currentMonth: string;
}> {
  if (!TEMPLATE_SPREADSHEET_ID) {
    throw new Error("GOOGLE_TEMPLATE_SPREADSHEET_ID is required.");
  }

  if (!Number.isFinite(budget) || budget <= 0) {
    throw new Error("Budget must be a positive number.");
  }

  const categories = buildValidatedCategories(categoryInputs);
  const config: MoneeConfig = {
    budget,
    slotLimit: DEFAULT_DAILY_SLOT_LIMIT,
    categories,
  };

  const drive = getDriveClient(accessToken);
  const copied = await drive.files.copy({
    fileId: TEMPLATE_SPREADSHEET_ID,
    requestBody: {
      name: "Monee",
      appProperties: {
        moneeManaged: "true",
        moneeSchemaVersion: MONEE_SCHEMA_VERSION,
      },
    },
    fields: "id,webViewLink",
    supportsAllDrives: true,
  });

  const spreadsheetId = copied.data.id;
  if (!spreadsheetId) {
    throw new Error("Failed to create spreadsheet from template.");
  }

  await ensureMetaSheet(accessToken, spreadsheetId);
  await writeSheetRange(accessToken, spreadsheetId, META_SHEET_NAME, "A1:E13", getMetaValues(config));

  const now = getCurrentYearMonthInTimeZone(timeZone);
  const currentYear = now.year;
  const currentMonthIndex = now.month;
  const currentMonth = getMonthTabName(currentYear, currentMonthIndex);

  const sheetMap = await getSheetMap(accessToken, spreadsheetId);
  const existingCurrentMonthSheetId = sheetMap.get(currentMonth);
  if (existingCurrentMonthSheetId != null) {
    await rewriteMonthSheet(
      accessToken,
      spreadsheetId,
      currentMonth,
      config,
      currentYear,
      currentMonthIndex,
      existingCurrentMonthSheetId
    );
  } else {
    await ensureMonthSheet(
      accessToken,
      spreadsheetId,
      config,
      currentYear,
      currentMonthIndex
    );
  }

  return {
    spreadsheetId,
    spreadsheetUrl: copied.data.webViewLink ?? getSpreadsheetUrl(spreadsheetId),
    config,
    currentMonth,
  };
}

export async function findNextEmptySlot(
  accessToken: string,
  spreadsheetId: string,
  slotLimit: number,
  dateStr: string
): Promise<{ row: number; col: number; tabName: string } | null> {
  const date = new Date(`${dateStr}T12:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth();
  const dayOfMonth = date.getDate();

  const firstDow = new Date(year, month, 1).getDay();
  const weekIndex = Math.floor((firstDow + dayOfMonth - 1) / 7);
  const dow = (firstDow + dayOfMonth - 1) % 7;

  const tabName = getMonthTabName(year, month);
  const colStart = DAY_START_COLS[dow];
  const dateRow = DAY_ROWS[weekIndex];

  const entryStartRow = dateRow + 1;
  const entryEndRow = entryStartRow + slotLimit - 1;

  const range = `${toA1(entryStartRow, colStart)}:${toA1(entryEndRow, colStart)}`;
  const values = await readSheetRange(accessToken, spreadsheetId, tabName, range);

  for (let i = 0; i < slotLimit; i++) {
    const value = values?.[i]?.[0];
    if (value == null || String(value).trim() === "") {
      return { row: entryStartRow + i, col: colStart, tabName };
    }
  }

  return null;
}

export async function writeEntry(
  accessToken: string,
  spreadsheetId: string,
  slotLimit: number,
  dateStr: string,
  source: string,
  categoryCode: string,
  amount: number
): Promise<{ row: number; col: number; tabName: string } | null> {
  const slot = await findNextEmptySlot(accessToken, spreadsheetId, slotLimit, dateStr);
  if (!slot) return null;

  const start = toA1(slot.row, slot.col);
  const end = toA1(slot.row, slot.col + 2);
  await writeSheetRange(accessToken, spreadsheetId, slot.tabName, `${start}:${end}`, [
    [source, categoryCode, amount],
  ]);
  return slot;
}
