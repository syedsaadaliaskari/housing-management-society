import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type CategoryRow = {
  id: number;
  name: string;
};

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(_req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = (await (sql as any)`
    SELECT id, name
    FROM expense_categories
    ORDER BY name ASC
  `) as CategoryRow[];

  return NextResponse.json(rows);
}
