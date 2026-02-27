import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type OwnershipRow = {
  id: number;
  unit_number: string;
  owner_name: string;
  from_date: string;
  to_date: string | null;
  purchase_price: string | null;
  sale_price: string | null;
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
      o.id,
      u.unit_number,
      m.first_name || ' ' || COALESCE(m.last_name, '') AS owner_name,
      o.from_date,
      o.to_date,
      o.purchase_price,
      o.sale_price
    FROM unit_ownerships o
    JOIN units u ON o.unit_id = u.id
    JOIN members m ON o.owner_member_id = m.id
    ORDER BY o.from_date DESC
  `) as OwnershipRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    unitId,
    ownerMemberId,
    fromDate,
    toDate,
    purchasePrice,
    salePrice,
  } = body as {
    unitId?: number;
    ownerMemberId?: number;
    fromDate?: string;
    toDate?: string | null;
    purchasePrice?: number | null;
    salePrice?: number | null;
  };

  if (!unitId || !ownerMemberId || !fromDate) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const rows = (await (sql as any)`
    INSERT INTO unit_ownerships (unit_id, owner_member_id, from_date, to_date, purchase_price, sale_price)
    VALUES (${unitId}, ${ownerMemberId}, ${fromDate}, ${toDate ?? null}, ${purchasePrice ?? null}, ${salePrice ?? null})
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

