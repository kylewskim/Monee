import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setupSpreadsheet } from "@/lib/moneeSpreadsheet";
import type { SetupCategoryInput } from "@/lib/types";

interface SetupCategoryInputBody {
  name?: string;
  colorHex?: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { budget?: number; categories?: SetupCategoryInputBody[]; timeZone?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const budget = Number(body.budget);
  const categories: SetupCategoryInput[] = Array.isArray(body.categories)
    ? body.categories.map((c) => ({
        name: String(c?.name ?? ""),
        colorHex: String(c?.colorHex ?? ""),
      }))
    : [];

  try {
    const result = await setupSpreadsheet(
      session.accessToken,
      budget,
      categories,
      body.timeZone
    );
    return Response.json({
      status: "ready",
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Setup failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
