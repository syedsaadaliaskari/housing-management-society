import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type PatrolRow = {
  id: number;
  guard_name: string;
  checkpoint: string;
  notes: string | null;
  status: string;
  created_at: string;
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
    SELECT id, guard_name, checkpoint, notes, status, created_at
    FROM patrol_logs
    ORDER BY created_at DESC
    LIMIT 300
  `) as PatrolRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { guardName, checkpoint, notes, status } = body as {
    guardName?: string;
    checkpoint?: string;
    notes?: string;
    status?: string;
  };

  if (!guardName || !checkpoint)
    return NextResponse.json(
      { error: "Guard name and checkpoint are required" },
      { status: 400 },
    );

  const allowed = ["COMPLETED", "ISSUE_FOUND", "SKIPPED"];
  const finalStatus = status && allowed.includes(status) ? status : "COMPLETED";
  const userId = (session.user as any).id;

  const rows = (await (sql as any)`
    INSERT INTO patrol_logs (guard_name, checkpoint, notes, status, logged_by)
    VALUES (${guardName}, ${checkpoint}, ${notes ?? null}, ${finalStatus}, ${userId})
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}
