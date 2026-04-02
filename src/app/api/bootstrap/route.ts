import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bootstrapSpreadsheet } from "@/lib/moneeSpreadsheet";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeZone = searchParams.get("tz");
    const result = await bootstrapSpreadsheet(session.accessToken, timeZone);
    return Response.json(result);
  } catch (err) {
    console.error("Bootstrap error:", err);
    return Response.json({ error: "Bootstrap failed" }, { status: 500 });
  }
}
