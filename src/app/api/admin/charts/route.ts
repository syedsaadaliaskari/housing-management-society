import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(_req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Monthly payments trend — last 6 months
  const monthlyPayments = (await (sql as any)`
    SELECT
      TO_CHAR(month_series, 'Mon YY') AS month,
      COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'SUCCESS'), 0)::int AS collected,
      COALESCE(SUM(b.balance_amount), 0)::int AS outstanding
    FROM generate_series(
      date_trunc('month', NOW()) - INTERVAL '5 months',
      date_trunc('month', NOW()),
      '1 month'
    ) AS month_series
    LEFT JOIN payments p
      ON date_trunc('month', p.created_at) = month_series
    LEFT JOIN bills b
      ON date_trunc('month', b.created_at) = month_series
      AND b.status IN ('PENDING', 'OVERDUE', 'PARTIALLY_PAID')
    GROUP BY month_series
    ORDER BY month_series ASC
  `) as { month: string; collected: number; outstanding: number }[];

  // Expenses by category — last 6 months
  // Expenses by category — last 6 months
  const expensesByCategory = (await (sql as any)`
    SELECT
      COALESCE(ec.name, 'Other') AS category,
      SUM(e.amount)::int AS total
    FROM society_expenses e
    LEFT JOIN expense_categories ec ON ec.id = e.category_id
    WHERE e.expense_date >= NOW() - INTERVAL '6 months'
    GROUP BY ec.name
    ORDER BY total DESC
    LIMIT 6
  `) as { category: string; total: number }[];

  // Ownership breakdown — Owner vs Tenant vs Both
  const ownershipBreakdown = (await (sql as any)`
    SELECT
      ownership_status,
      COUNT(*)::int AS count
    FROM members
    WHERE is_active = TRUE
    GROUP BY ownership_status
  `) as { ownership_status: string; count: number }[];

  return NextResponse.json({
    monthlyPayments,
    expensesByCategory,
    ownershipBreakdown,
  });
}
