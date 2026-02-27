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

