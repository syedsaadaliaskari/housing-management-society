import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type SosRow = {
  id: number;
  member_name: string | null;
  unit_number: string | null;
  alert_type: string;
  message: string | null;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
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
      e.id,
      m.first_name || ' ' || COALESCE(m.last_name, '') AS member_name,
      u.unit_number,
      e.alert_type,
      e.message,
      e.status,
      e.created_at,
      e.acknowledged_at,
      e.resolved_at
    FROM emergency_alerts e
    LEFT JOIN members m ON e.member_id = m.id
    LEFT JOIN units u ON e.unit_id = u.id
    ORDER BY e.created_at DESC
  `) as SosRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { memberId, unitId, alertType, message } = body as {
    memberId?: number;
    unitId?: number | null;
    alertType?: string;
    message?: string | null;
  };

  if (!memberId || !alertType) {
    return NextResponse.json(
      { error: "Missing required fields" },
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

