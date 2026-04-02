import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readSheetRange } from "@/lib/googleSheets";
import {
  ensureMonthSheet,
  getCurrentMonthTabName,
  getManagedSpreadsheetContext,
  parseMonthTabName,
  SpreadsheetValidationError,
} from "@/lib/moneeSpreadsheet";
import type { MonthlySummary } from "@/lib/types";

function parseNumericCell(row: Array<string | number> | undefined): number {
  if (!row) return 0;
  for (const cell of row) {
    const n = Number(cell);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return 0;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeZone = searchParams.get("tz");
  const requestedTab = searchParams.get("month") || getCurrentMonthTabName(timeZone);
  const parsed = parseMonthTabName(requestedTab);
  if (!parsed) {
    return Response.json({ error: "Invalid month format" }, { status: 400 });
  }

  try {
    const context = await getManagedSpreadsheetContext(session.accessToken);

    const tabName = await ensureMonthSheet(
      session.accessToken,
      context.spreadsheetId,
      context.config,
      parsed.year,
      parsed.month
    );

    const summaryRows = await readSheetRange(
      session.accessToken,
      context.spreadsheetId,
      tabName,
      "B4:C6"
    );
    const categoryRows = await readSheetRange(
      session.accessToken,
      context.spreadsheetId,
      tabName,
      "B8:C15"
    );

    const categories = context.config.categories.map((cat, idx) => {
      const row = categoryRows[idx] ?? [];
      const total = parseNumericCell([row[1]]);
      return {
        code: cat.code,
        name: cat.name,
        colorHex: cat.colorHex,
        total,
      };
    });

    const payload: MonthlySummary = {
      month: tabName,
      budget: parseNumericCell(summaryRows[0]),
      used: parseNumericCell(summaryRows[1]),
      left: parseNumericCell(summaryRows[2]),
      categories,
      spreadsheetUrl: context.spreadsheetUrl,
      slotLimit: context.config.slotLimit,
    };

    return Response.json(payload);
  } catch (err) {
    if (err instanceof SpreadsheetValidationError) {
      return Response.json(
        {
          error: "SETUP_REQUIRED",
          reason: err.reason,
          message: err.message,
        },
        { status: 409 }
      );
    }

    console.error("Summary fetch error:", err);
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
