import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type VisitorRow = {
  id: number;
  visitor_name: string;
  visitor_phone: string | null;
  purpose: string | null;
  vehicle_number: string | null;
  status: string;
  pre_approved: boolean;
  member_name: string | null;
  unit_number: string | null;
  expected_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
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
    SELECT
      v.id,
      v.visitor_name,
      v.visitor_phone,
      v.purpose,
      v.vehicle_number,
      v.status,
      v.pre_approved,
      m.first_name || ' ' || COALESCE(m.last_name, '') AS member_name,
      u.unit_number,
      v.expected_at,
      v.checked_in_at,
      v.checked_out_at,
      v.created_at
    FROM visitors v
    LEFT JOIN members m ON v.member_id = m.id
    LEFT JOIN units u ON v.unit_id = u.id
    ORDER BY v.created_at DESC
  `) as VisitorRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    memberId,
    visitorName,
    visitorPhone,
    purpose,
    vehicleNumber,
    preApproved,
    expectedAt,
  } = body as {
    memberId?: number;
    visitorName?: string;
    visitorPhone?: string;
    purpose?: string;
    vehicleNumber?: string;
    preApproved?: boolean;
    expectedAt?: string | null;
  };

  if (!visitorName || !memberId)
    return NextResponse.json(
      { error: "Visitor name and member are required" },
      { status: 400 },
    );

  // Auto-resolve member's current unit
  const unitRows = (await (sql as any)`
    SELECT unit_id FROM unit_residents
    WHERE member_id = ${memberId} AND to_date IS NULL
    LIMIT 1
  `) as { unit_id: number }[];
  const unitId = unitRows[0]?.unit_id ?? null;

  const userId = (session.user as any).id;

  const rows = (await (sql as any)`
    INSERT INTO visitors (
      member_id, unit_id, visitor_name, visitor_phone,
      purpose, vehicle_number, status, pre_approved,
      expected_at, created_by
    )
    VALUES (
      ${memberId},
      ${unitId},
      ${visitorName},
      ${visitorPhone ?? null},
      ${purpose ?? null},
      ${vehicleNumber ?? null},
      'EXPECTED',
      ${preApproved ?? false},
      ${expectedAt ?? null},
      ${userId}
    )
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status } = body as { id?: number; status?: string };

  if (!id || !status)
    return NextResponse.json(
      { error: "Missing id or status" },
      { status: 400 },
    );

  const allowed = ["EXPECTED", "CHECKED_IN", "CHECKED_OUT", "DENIED"];
  if (!allowed.includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  if (status === "CHECKED_IN") {
    await (sql as any)`
      UPDATE visitors SET status = ${status}, checked_in_at = NOW()
      WHERE id = ${id}
    `;
  } else if (status === "CHECKED_OUT") {
    await (sql as any)`
      UPDATE visitors SET status = ${status}, checked_out_at = NOW()
      WHERE id = ${id}
    `;
  } else {
    await (sql as any)`
      UPDATE visitors SET status = ${status} WHERE id = ${id}
    `;
  }

  return NextResponse.json({ ok: true });
}
