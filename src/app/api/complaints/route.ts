import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type ComplaintRow = {
  id: number;
  member_name: string | null;
  unit_number: string | null;
  category_name: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
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
      c.id,
      m.first_name || ' ' || COALESCE(m.last_name, '') AS member_name,
      u.unit_number,
      cc.name AS category_name,
      c.subject,
      c.description,
      c.status,
      c.priority,
      c.created_at,
      c.updated_at
    FROM complaints c
    LEFT JOIN members m ON c.member_id = m.id
    LEFT JOIN units u ON c.unit_id = u.id
    LEFT JOIN complaint_categories cc ON c.category_id = cc.id
    ORDER BY c.created_at DESC
  `) as ComplaintRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    memberId,
    unitId,
    categoryId,
    subject,
    description,
    priority,
  } = body as {
    memberId?: number;
    unitId?: number | null;
    categoryId?: number | null;
    subject?: string;
    description?: string;
    priority?: string;
  };

  if (!memberId || !subject || !description || !priority) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const rows = (await (sql as any)`
    INSERT INTO complaints (
      member_id,
      unit_id,
      category_id,
      subject,
      description,
      status,
      priority
    )
    VALUES (
      ${memberId},
      ${unitId ?? null},
      ${categoryId ?? null},
      ${subject},
      ${description},
      'OPEN',
      ${priority}
    )
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

