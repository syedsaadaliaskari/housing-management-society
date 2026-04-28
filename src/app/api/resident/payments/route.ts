import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type ResidentPaymentRow = {
  id: number;
  bill_id: number;
  unit_number: string;
  payment_date: string;
  amount: string;
  method: string;
  status: string;
  reference_number: string | null;
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await (sql as any)`
    SELECT
      p.id,
      p.bill_id,
      u.unit_number,
      p.payment_date,
      p.amount,
      p.method,
      p.status,
      p.reference_number
    FROM payments p
    JOIN bills b ON p.bill_id = b.id
    JOIN units u ON b.unit_id = u.id
    WHERE p.member_id = ${memberId}
    ORDER BY p.payment_date DESC
  `) as ResidentPaymentRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { billId, amount, method } = body as {
    billId?: number;
    amount?: number;
    method?: string;
  };

  if (!billId || amount == null || !method) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const referenceNumber = `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const rows = (await (sql as any)`
    INSERT INTO payments (bill_id, member_id, amount, method, status, reference_number)
    VALUES (${billId}, ${memberId}, ${amount}, ${method}, 'SUCCESS', ${referenceNumber})
    RETURNING id, reference_number
  `) as { id: number; reference_number: string }[];

  await (sql as any)`
    UPDATE bills
    SET
      balance_amount = GREATEST(balance_amount - ${amount}, 0),
      status = CASE
        WHEN balance_amount - ${amount} <= 0 THEN 'PAID'
        ELSE 'PARTIALLY_PAID'
      END
    WHERE id = ${billId}
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
