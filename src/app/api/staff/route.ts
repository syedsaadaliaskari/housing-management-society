import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type StaffRow = {
  id: number;
  full_name: string;
  phone: string | null;
  type: string;
  company_name: string | null;
  id_card_number: string | null;
  member_name: string | null;
  unit_number: string | null;
  is_active: boolean;
  entry_time: string | null;
  exit_time: string | null;
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
      sv.id,
      sv.full_name,
      sv.phone,
      sv.type,
      sv.company_name,
      sv.id_card_number,
      m.first_name || ' ' || COALESCE(m.last_name, '') AS member_name,
      u.unit_number,
      sv.is_active,
      sv.entry_time,
      sv.exit_time,
      sv.created_at
    FROM staff_vendors sv
    LEFT JOIN members m ON sv.member_id = m.id
    LEFT JOIN units u ON sv.unit_id = u.id
    ORDER BY sv.is_active DESC, sv.full_name ASC
  `) as StaffRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    fullName,
    phone,
    type,
    companyName,
    idCardNumber,
    memberId,
    entryTime,
    exitTime,
  } = body as {
    fullName?: string;
    phone?: string;
    type?: string;
    companyName?: string;
    idCardNumber?: string;
    memberId?: number | null;
    entryTime?: string | null;
    exitTime?: string | null;
  };

  if (!fullName || !type)
    return NextResponse.json(
      { error: "Name and type are required" },
      { status: 400 },
    );

  let unitId: number | null = null;
  if (memberId) {
    const ur = (await (sql as any)`
      SELECT unit_id FROM unit_residents
      WHERE member_id = ${memberId} AND to_date IS NULL LIMIT 1
    `) as { unit_id: number }[];
    unitId = ur[0]?.unit_id ?? null;
  }

  const rows = (await (sql as any)`
    INSERT INTO staff_vendors
      (full_name, phone, type, company_name, id_card_number, member_id, unit_id, entry_time, exit_time)
    VALUES
      (${fullName}, ${phone ?? null}, ${type}, ${companyName ?? null},
       ${idCardNumber ?? null}, ${memberId ?? null}, ${unitId},
       ${entryTime ?? null}, ${exitTime ?? null})
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, isActive } = (await req.json()) as {
    id?: number;
    isActive?: boolean;
  };

  if (id === undefined || isActive === undefined)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await (sql as any)`UPDATE staff_vendors SET is_active = ${isActive} WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
