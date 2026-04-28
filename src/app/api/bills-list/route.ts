import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type BillListRow = {
  id: number;
  unit_number: string;
  due_date: string;
  balance_amount: string;
  status: string;
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
      b.id,
      u.unit_number,
      TO_CHAR(b.due_date, 'YYYY-MM-DD') AS due_date,
      b.balance_amount::text,
      b.status
    FROM bills b
    JOIN units u ON u.id = b.unit_id
    WHERE b.status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')
    ORDER BY b.due_date ASC
  `) as BillListRow[];

  return NextResponse.json(rows);
}
