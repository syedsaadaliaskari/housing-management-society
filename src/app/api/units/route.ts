import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type UnitRow = {
  id: number;
  unit_number: string;
  block_name: string | null;
  floor: number | null;
  unit_type_name: string;
  area_sq_ft: string | null;
  is_active: boolean;
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
      u.id,
      u.unit_number,
      b.name AS block_name,
      u.floor,
      ut.name AS unit_type_name,
      u.area_sq_ft,
      u.is_active
    FROM units u
    LEFT JOIN blocks b ON u.block_id = b.id
    JOIN unit_types ut ON u.unit_type_id = ut.id
    ORDER BY u.unit_number
  `) as UnitRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { unitNumber, blockId, floor, unitTypeId, areaSqFt } = body as {
    unitNumber?: string;
    blockId?: number | null;
    floor?: number | null;
    unitTypeId?: number;
    areaSqFt?: number | null;
  };

  if (!unitNumber || !unitTypeId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const rows = (await (sql as any)`
    INSERT INTO units (unit_number, block_id, floor, unit_type_id, area_sq_ft)
    VALUES (${unitNumber}, ${blockId ?? null}, ${floor ?? null}, ${unitTypeId}, ${areaSqFt ?? null})
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

