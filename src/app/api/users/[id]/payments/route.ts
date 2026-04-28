import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = Number(params.id);

  const payments = (await (sql as any)`
    SELECT
      p.id,
      p.amount,
      p.method,
      p.status,
      p.payment_date,
      p.reference_number,
      u.unit_number
    FROM payments p
    JOIN bills b ON b.id = p.bill_id
    JOIN units u ON u.id = b.unit_id
    JOIN members m ON m.id = p.member_id
    JOIN users us ON us.member_id = m.id
    WHERE us.id = ${userId}
    ORDER BY p.payment_date DESC
    LIMIT 10
  `) as {
    id: number;
    amount: string;
    method: string;
    status: string;
    payment_date: string;
    reference_number: string | null;
    unit_number: string;
  }[];

  const monthly = (await (sql as any)`
    SELECT
      TO_CHAR(month_series, 'Mon YY') AS month,
      COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'SUCCESS'), 0)::int AS total
    FROM generate_series(
      date_trunc('month', NOW()) - INTERVAL '5 months',
      date_trunc('month', NOW()),
      '1 month'
    ) AS month_series
    LEFT JOIN payments p
      ON date_trunc('month', p.payment_date) = month_series
    LEFT JOIN bills b ON b.id = p.bill_id
    LEFT JOIN members m ON m.id = p.member_id
    LEFT JOIN users us ON us.member_id = m.id AND us.id = ${userId}
    GROUP BY month_series
    ORDER BY month_series ASC
  `) as { month: string; total: number }[];

  return NextResponse.json({ payments, monthly });
}
