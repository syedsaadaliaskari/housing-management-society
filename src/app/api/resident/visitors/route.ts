import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type ResidentVisitorRow = {
  id: number;
  visitor_name: string;
  visitor_phone: string | null;
  purpose: string | null;
  vehicle_number: string | null;
  status: string;
  pre_approved: boolean;
  unit_number: string | null;
  expected_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId)
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
      u.unit_number,
      v.expected_at,
      v.checked_in_at,
      v.checked_out_at,
      v.created_at
    FROM visitors v
    LEFT JOIN units u ON v.unit_id = u.id
    WHERE v.member_id = ${memberId}
    ORDER BY v.created_at DESC
  `) as ResidentVisitorRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { visitorName, visitorPhone, purpose, vehicleNumber, expectedAt } =
    body as {
      visitorName?: string;
      visitorPhone?: string;
      purpose?: string;
      vehicleNumber?: string;
      expectedAt?: string | null;
    };

  if (!visitorName)
    return NextResponse.json(
      { error: "Visitor name is required" },
      { status: 400 },
    );

  // Auto-resolve member's current unit
  const unitRows = (await (sql as any)`
    SELECT unit_id FROM unit_residents
    WHERE member_id = ${memberId} AND to_date IS NULL
    LIMIT 1
  `) as { unit_id: number }[];
  const unitId = unitRows[0]?.unit_id ?? null;

  const rows = (await (sql as any)`
    INSERT INTO visitors (
      member_id, unit_id, visitor_name, visitor_phone,
      purpose, vehicle_number, status, pre_approved, expected_at
    )
    VALUES (
      ${memberId},
      ${unitId},
      ${visitorName},
      ${visitorPhone ?? null},
      ${purpose ?? null},
      ${vehicleNumber ?? null},
      'EXPECTED',
      true,
      ${expectedAt ?? null}
    )
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}
