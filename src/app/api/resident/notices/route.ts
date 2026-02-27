import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type ResidentNoticeRow = {
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

export async function GET(_req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId) {
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
    WHERE start_at <= NOW()
      AND (end_at IS NULL OR end_at >= NOW())
    ORDER BY created_at DESC
  `) as ResidentNoticeRow[];

  return NextResponse.json(rows);
}

