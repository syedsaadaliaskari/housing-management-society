import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type ResidentComplaintRow = {
  id: number;
  unit_number: string | null;
  category_name: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
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
      c.id,
      u.unit_number,
      cc.name AS category_name,
      c.subject,
      c.description,
      c.status,
      c.priority,
      c.created_at
    FROM complaints c
    LEFT JOIN units u ON c.unit_id = u.id
    LEFT JOIN complaint_categories cc ON c.category_id = cc.id
    WHERE c.member_id = ${memberId}
    ORDER BY c.created_at DESC
  `) as ResidentComplaintRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { unitId, categoryId, subject, description, priority } = body as {
    unitId?: number | null;
    categoryId?: number | null;
    subject?: string;
    description?: string;
    priority?: string;
  };

  if (!subject || !description || !priority) {
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

