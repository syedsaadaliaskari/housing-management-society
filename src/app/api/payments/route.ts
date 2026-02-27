import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type PaymentRow = {
  id: number;
  bill_id: number;
  unit_number: string;
  member_name: string | null;
  payment_date: string;
  amount: string;
  method: string;
  status: string;
  reference_number: string | null;
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
      p.id,
      p.bill_id,
      u.unit_number,
      m.first_name || ' ' || COALESCE(m.last_name, '') AS member_name,
      p.payment_date,
      p.amount,
      p.method,
      p.status,
      p.reference_number
    FROM payments p
    JOIN bills b ON p.bill_id = b.id
    JOIN units u ON b.unit_id = u.id
    LEFT JOIN members m ON p.member_id = m.id
    ORDER BY p.payment_date DESC
  `) as PaymentRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { billId, memberId, amount, method, status, referenceNumber } = body as {
    billId?: number;
    memberId?: number | null;
    amount?: number;
    method?: string;
    status?: string;
    referenceNumber?: string | null;
  };

  if (!billId || amount == null || !method || !status) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const rows = (await (sql as any)`
    INSERT INTO payments (bill_id, member_id, amount, method, status, reference_number)
    VALUES (
      ${billId},
      ${memberId ?? null},
      ${amount},
      ${method},
      ${status},
      ${referenceNumber ?? null}
    )
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

