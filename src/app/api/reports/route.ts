import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type SummaryRow = { total_income: string | null };
type ExpenseRow = { total_expense: string | null };
type OutstandingRow = { outstanding: string | null };
type DefaulterRow = { defaulter_count: number };

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

  const [incomeRow] = (await (sql as any)`
    SELECT COALESCE(SUM(amount), 0) AS total_income
    FROM payments
    WHERE status = 'SUCCESS'
  `) as SummaryRow[];

  const [expenseRow] = (await (sql as any)`
    SELECT COALESCE(SUM(amount), 0) AS total_expense
    FROM society_expenses
  `) as ExpenseRow[];

  const [outstandingRow] = (await (sql as any)`
    SELECT COALESCE(SUM(balance_amount), 0) AS outstanding
    FROM bills
    WHERE status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')
  `) as OutstandingRow[];

  const [defaulterRow] = (await (sql as any)`
    SELECT COUNT(*) AS defaulter_count
    FROM bills
    WHERE balance_amount > 0 AND due_date < CURRENT_DATE
  `) as DefaulterRow[];

  return NextResponse.json({
    totalIncome: incomeRow.total_income ?? "0",
    totalExpense: expenseRow.total_expense ?? "0",
    outstanding: outstandingRow.outstanding ?? "0",
    defaulterCount: defaulterRow.defaulter_count,
  });
}

