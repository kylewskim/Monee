import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeEntry } from "@/lib/sheetAlgorithm";

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

  try {
    const location = await writeEntry(
      session.accessToken,
      date,
      source.trim(),
      category,
      amount
    );
    return Response.json({
      success: true,
      cell: `Row ${location.row}, Col ${location.col}`,
      tab: location.tabName,
    });
  } catch (err) {
    console.error("Entry write error:", err);
    return Response.json({ error: "Failed to write entry" }, { status: 500 });
  }
}
