import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type NotifRow = {
  id: number;
  user_id: number;
  title: string;
  body: string | null;
  type: string;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
};

async function getSession() {
  return await auth();
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const rows = (await (sql as any)`
    SELECT id, user_id, title, body, type, reference_id, is_read, created_at
    FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as NotifRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { userId, title, notifBody, type, referenceId } = body as {
    userId?: number;
    title?: string;
    notifBody?: string;
    type?: string;
    referenceId?: number;
  };

  if (!userId || !title || !type)
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );

  const rows = (await (sql as any)`
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (${userId}, ${title}, ${notifBody ?? null}, ${type}, ${referenceId ?? null})
    RETURNING id, created_at
  `) as { id: number; created_at: string }[];

  return NextResponse.json(rows[0], { status: 201 });
}
