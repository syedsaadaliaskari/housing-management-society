import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type OutstandingRow = { outstanding: string | null };
type PaymentRow = { last_payment_at: string | null };
type ComplaintRow = { open_count: number };
type SosRow = { active_count: number };

export async function GET(_req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [outstandingRow] = (await (sql as any)`
    SELECT COALESCE(SUM(b.balance_amount), 0) AS outstanding
    FROM bills b
    JOIN unit_residents ur ON b.unit_id = ur.unit_id
    WHERE ur.member_id = ${memberId}
      AND ur.is_primary_contact = TRUE
      AND b.status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')
  `) as OutstandingRow[];

  const [paymentRow] = (await (sql as any)`
    SELECT MAX(payment_date) AS last_payment_at
    FROM payments
    WHERE member_id = ${memberId} AND status = 'SUCCESS'
  `) as PaymentRow[];

  const [complaintRow] = (await (sql as any)`
    SELECT COUNT(*) AS open_count
    FROM complaints
    WHERE member_id = ${memberId}
      AND status IN ('OPEN', 'IN_PROGRESS')
  `) as ComplaintRow[];

  const [sosRow] = (await (sql as any)`
    SELECT COUNT(*) AS active_count
    FROM emergency_alerts
    WHERE member_id = ${memberId}
      AND status IN ('ACTIVE', 'ACKNOWLEDGED')
  `) as SosRow[];

  return NextResponse.json({
    outstanding: outstandingRow.outstanding ?? "0",
    lastPaymentAt: paymentRow.last_payment_at,
    openComplaints: complaintRow.open_count,
    activeAlerts: sosRow.active_count,
  });
}

