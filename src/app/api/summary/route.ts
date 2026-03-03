import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readSheetRange } from "@/lib/googleSheets";
import { getCurrentTabName } from "@/lib/sheetAlgorithm";
import type { MonthlySummary, CategoryLetter } from "@/lib/types";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tabName = searchParams.get("month") || getCurrentTabName();

  try {
    // Read B3:C11 — budget summary + category totals
    const values = await readSheetRange(session.accessToken, tabName, "B3:C11");

    // Find the first numeric value in the row, regardless of which column it's in
    const parse = (rowIdx: number): number => {
      const row = values?.[rowIdx] ?? [];
      for (const cell of row) {
        const n = parseFloat(String(cell ?? ""));
        if (!isNaN(n)) return n;
      }
      return 0;
    };

    const summary: MonthlySummary = {
      month: tabName,
      budget: parse(0), // row 3 = index 0
      used: parse(1),   // row 4 = index 1
      left: parse(2),   // row 5 = index 2
      categories: [
        // rows 7-11 = indices 4-8 (row 6 is blank)
        { letter: "F" as CategoryLetter, name: "Food",         total: parse(4) },
        { letter: "S" as CategoryLetter, name: "Subscription", total: parse(5) },
        { letter: "C" as CategoryLetter, name: "Chulsu",       total: parse(6) },
        { letter: "P" as CategoryLetter, name: "Personal",     total: parse(7) },
        { letter: "O" as CategoryLetter, name: "Others",       total: parse(8) },
      ],
    };

    return Response.json(summary);
  } catch (err) {
    console.error("Summary fetch error:", err);
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}