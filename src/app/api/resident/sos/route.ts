import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type ResidentSosRow = {
  id: number;
  unit_number: string | null;
  alert_type: string;
  message: string | null;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await (sql as any)`
    SELECT
      e.id,
      u.unit_number,
      e.alert_type,
      e.message,
      e.status,
      e.created_at,
      e.acknowledged_at,
      e.resolved_at
    FROM emergency_alerts e
    LEFT JOIN units u ON e.unit_id = u.id
    WHERE e.member_id = ${memberId}
    ORDER BY e.created_at DESC
  `) as ResidentSosRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { unitId, alertType, message } = body as {
    unitId?: number | null;
    alertType?: string;
    message?: string | null;
  };

  if (!alertType) {
    return NextResponse.json(
      { error: "Missing alert type" },
      { status: 400 }
    );
  }

  const rows = (await (sql as any)`
    INSERT INTO emergency_alerts (
      member_id,
      unit_id,
      alert_type,
      message,
      status
    )
    VALUES (
      ${memberId},
      ${unitId ?? null},
      ${alertType},
      ${message ?? null},
      'ACTIVE'
    )
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

