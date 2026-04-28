import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type SummaryRow = { total_income: string | null };
type ExpenseRow = { total_expense: string | null };
type OutstandingRow = { outstanding: string | null };
type DefaulterRow = { defaulter_count: number };

type MonthlyRow = {
  month: string;
  income: string;
  expense: string;
};

type DefaulterDetailRow = {
  member_name: string;
  email: string;
  unit_number: string | null;
  balance_amount: string;
  due_date: string;
};

type OutstandingBillRow = {
  member_name: string;
  email: string;
  amount: string;
  balance_amount: string;
  due_date: string;
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

  try {
    const [incomeRow] = (await (sql as any)`
      SELECT COALESCE(SUM(amount), 0) AS total_income
      FROM payments
      WHERE status = 'SUCCESS'
    `) as SummaryRow[];
    console.log("✅ income done");

    const [expenseRow] = (await (sql as any)`
      SELECT COALESCE(SUM(amount), 0) AS total_expense
      FROM society_expenses
    `) as ExpenseRow[];

    const [outstandingRow] = (await (sql as any)`
      SELECT COALESCE(SUM(balance_amount), 0) AS outstanding
      FROM bills
      WHERE status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')
    `) as OutstandingRow[];
    console.log("✅ outstanding done");

    const [defaulterRow] = (await (sql as any)`
      SELECT COUNT(*) AS defaulter_count
      FROM bills
      WHERE balance_amount > 0 AND due_date < CURRENT_DATE
    `) as DefaulterRow[];
    console.log("✅ defaulters done");

    const monthlyData = (await (sql as any)`
      SELECT
        TO_CHAR(month_series, 'Mon YY') AS month,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'SUCCESS'), 0)::text AS income,
        COALESCE(SUM(e.amount), 0)::text AS expense
      FROM generate_series(
        date_trunc('month', NOW()) - INTERVAL '5 months',
        date_trunc('month', NOW()),
        '1 month'
      ) AS month_series
      LEFT JOIN payments p
        ON date_trunc('month', p.created_at) = month_series
      LEFT JOIN society_expenses e
        ON date_trunc('month', e.expense_date) = month_series
      GROUP BY month_series
      ORDER BY month_series ASC
    `) as MonthlyRow[];
    console.log("✅ monthly done");

    // Defaulters detail table
    const defaulters = (await (sql as any)`
    SELECT
      CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) AS member_name,
      m.email,
      u.unit_number,
      b.balance_amount::text,
      TO_CHAR(b.due_date, 'YYYY-MM-DD') AS due_date
    FROM bills b
    JOIN units u ON u.id = b.unit_id
    LEFT JOIN unit_residents ur ON ur.unit_id = b.unit_id AND ur.to_date IS NULL
    LEFT JOIN members m ON m.id = ur.member_id
    WHERE b.balance_amount > 0 AND b.due_date < CURRENT_DATE
    ORDER BY b.due_date ASC
    LIMIT 10
  `) as DefaulterDetailRow[];

    // Outstanding bills table
    const outstandingBills = (await (sql as any)`
    SELECT
      CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) AS member_name,
      m.email,
      b.total_amount::text AS amount,
      b.balance_amount::text,
      TO_CHAR(b.due_date, 'YYYY-MM-DD') AS due_date,
      b.status
    FROM bills b
    JOIN units u ON u.id = b.unit_id
    LEFT JOIN unit_residents ur ON ur.unit_id = b.unit_id AND ur.to_date IS NULL
    LEFT JOIN members m ON m.id = ur.member_id
    WHERE b.status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')
    ORDER BY b.due_date ASC
    LIMIT 10
  `) as OutstandingBillRow[];

    return NextResponse.json({
      totalIncome: incomeRow.total_income ?? "0",
      totalExpense: expenseRow.total_expense ?? "0",
      outstanding: outstandingRow.outstanding ?? "0",
      defaulterCount: defaulterRow.defaulter_count,
      monthlyData,
      defaulters,
      outstandingBills,
    });
  } catch (err) {
    console.error("❌ Reports API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
