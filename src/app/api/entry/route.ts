import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ensureMonthSheet,
  getManagedSpreadsheetContext,
  SpreadsheetValidationError,
  writeEntry,
} from "@/lib/moneeSpreadsheet";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { date?: string; source?: string; category?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, source, category, amount } = body;

  if (!date || !source || !category || amount == null) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Invalid date format" }, { status: 400 });
  }

  const amountNumber = Number(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const context = await getManagedSpreadsheetContext(session.accessToken);

    const categoryCode = String(category).toUpperCase();
    const hasCategory = context.config.categories.some((cat) => cat.code === categoryCode);
    if (!hasCategory) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }

    const dateObj = new Date(`${date}T12:00:00`);
    if (Number.isNaN(dateObj.getTime())) {
      return Response.json({ error: "Invalid date" }, { status: 400 });
    }

    await ensureMonthSheet(
      session.accessToken,
      context.spreadsheetId,
      context.config,
      dateObj.getFullYear(),
      dateObj.getMonth()
    );

    const location = await writeEntry(
      session.accessToken,
      context.spreadsheetId,
      context.config.slotLimit,
      date,
      source.trim(),
      categoryCode,
      amountNumber
    );

    if (!location) {
      return Response.json(
        {
          error: "DAY_SLOT_FULL",
          message: "No empty slot for this date",
          slotLimit: context.config.slotLimit,
          date,
        },
        { status: 409 }
      );
    }

    return Response.json({
      success: true,
      cell: `Row ${location.row}, Col ${location.col}`,
      tab: location.tabName,
    });
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

    console.error("Entry write error:", err);
    return Response.json({ error: "Failed to write entry" }, { status: 500 });
  }
}
