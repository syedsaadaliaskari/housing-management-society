import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type ResidentBillRow = {
  id: number;
  unit_number: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  status: string;
  total_amount: string;
  balance_amount: string;
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await (sql as any)`
    SELECT
      b.id,
      u.unit_number,
      b.billing_period_start,
      b.billing_period_end,
      b.due_date,
      b.status,
      b.total_amount,
      b.balance_amount
    FROM bills b
    JOIN units u ON b.unit_id = u.id
    JOIN unit_residents ur ON ur.unit_id = u.id
    WHERE ur.member_id = ${memberId}
      AND ur.is_primary_contact = TRUE
    ORDER BY b.due_date DESC
  `) as ResidentBillRow[];

  return NextResponse.json(rows);
}
