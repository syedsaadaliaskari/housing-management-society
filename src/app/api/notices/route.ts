import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type NoticeRow = {
  id: number;
  title: string;
  content: string;
  priority: string;
  audience_scope: string;
  block_id: number | null;
  start_at: string;
  end_at: string | null;
  created_at: string;
};

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET(_req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await (sql as any)`
    SELECT
      id,
      title,
      content,
      priority,
      audience_scope,
      block_id,
      start_at,
      end_at,
      created_at
    FROM notices
    ORDER BY created_at DESC
  `) as NoticeRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    content,
    priority,
    audienceScope,
    blockId,
    startAt,
    endAt,
  } = body as {
    title?: string;
    content?: string;
    priority?: string;
    audienceScope?: string;
    blockId?: number | null;
    startAt?: string | null;
    endAt?: string | null;
  };

  if (!title || !content || !priority) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const rows = (await (sql as any)`
    INSERT INTO notices (
      title,
      content,
      priority,
      audience_scope,
      block_id,
      created_by,
      start_at,
      end_at
    )
    VALUES (
      ${title},
      ${content},
      ${priority},
      ${audienceScope ?? "ALL"},
      ${blockId ?? null},
      ${Number((session.user as any).id) ?? null},
      ${startAt ?? null},
      ${endAt ?? null}
    )
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

