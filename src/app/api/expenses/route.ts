import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type ExpenseRow = {
  id: number;
  category_name: string | null;
  description: string;
  expense_date: string;
  amount: string;
  payment_mode: string | null;
  payee: string | null;
  invoice_number: string | null;
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
      e.id,
      c.name AS category_name,
      e.description,
      e.expense_date,
      e.amount,
      e.payment_mode,
      e.payee,
      e.invoice_number
    FROM society_expenses e
    LEFT JOIN expense_categories c ON e.category_id = c.id
    ORDER BY e.expense_date DESC, e.id DESC
  `) as ExpenseRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    categoryId,
    description,
    expenseDate,
    amount,
    paymentMode,
    payee,
    invoiceNumber,
  } = body as {
    categoryId?: number | null;
    description?: string;
    expenseDate?: string;
    amount?: number;
    paymentMode?: string | null;
    payee?: string | null;
    invoiceNumber?: string | null;
  };

  if (!description || !expenseDate || amount == null) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const rows = (await (sql as any)`
    INSERT INTO society_expenses (
      category_id,
      description,
      expense_date,
      amount,
      payment_mode,
      payee,
      invoice_number
    )
    VALUES (
      ${categoryId ?? null},
      ${description},
      ${expenseDate},
      ${amount},
      ${paymentMode ?? null},
      ${payee ?? null},
      ${invoiceNumber ?? null}
    )
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

