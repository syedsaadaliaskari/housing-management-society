import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json();
  const { ids } = body as { ids?: number[] | "all" };

  if (ids === "all") {
    await (sql as any)`
      UPDATE notifications SET is_read = TRUE
      WHERE user_id = ${userId} AND is_read = FALSE
    `;
  } else if (Array.isArray(ids) && ids.length > 0) {
    await (sql as any)`
      UPDATE notifications SET is_read = TRUE
      WHERE user_id = ${userId} AND id = ANY(${ids}::int[])
    `;
  } else {
    return NextResponse.json(
      { error: "Provide ids array or 'all'" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
