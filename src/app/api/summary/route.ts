import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readSheetRange } from "@/lib/googleSheets";
import { getCurrentTabName } from "@/lib/sheetAlgorithm";
import type { MonthlySummary, CategoryLetter } from "@/lib/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tabName = getCurrentTabName();

  try {
    // Read B3:C11 — budget summary + category totals
    const values = await readSheetRange(session.accessToken, tabName, "B3:C11");

    // Look up values by label (col B) to avoid row-order assumptions
    const findByLabel = (label: string): number => {
      const row = values?.find(
        (r) => String(r?.[0] ?? "").trim().toLowerCase() === label.toLowerCase()
      );
      return parseFloat(String(row?.[1] ?? 0)) || 0;
    };

    const summary: MonthlySummary = {
      month: tabName,
      budget: findByLabel("Budget"),
      used: findByLabel("Used"),
      left: findByLabel("Left"),
      categories: [
        { letter: "F" as CategoryLetter, name: "Food",         total: findByLabel("Food") },
        { letter: "S" as CategoryLetter, name: "Subscription", total: findByLabel("Subscription") },
        { letter: "C" as CategoryLetter, name: "Chulsu",       total: findByLabel("Chulsu") },
        { letter: "P" as CategoryLetter, name: "Personal",     total: findByLabel("Personal") },
        { letter: "O" as CategoryLetter, name: "Others",       total: findByLabel("Others") },
      ],
    };

    return Response.json(summary);
  } catch (err) {
    console.error("Summary fetch error:", err);
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
