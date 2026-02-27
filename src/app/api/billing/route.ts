import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type BillRow = {
  id: number;
  unit_number: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  status: string;
  total_amount: string;
  balance_amount: string;
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
    ORDER BY b.billing_period_start DESC, u.unit_number
  `) as BillRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    unitId,
    billingPeriodStart,
    billingPeriodEnd,
    dueDate,
    totalAmount,
  } = body as {
    unitId?: number;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
    dueDate?: string;
    totalAmount?: number;
  };

  if (
    !unitId ||
    !billingPeriodStart ||
    !billingPeriodEnd ||
    !dueDate ||
    totalAmount == null
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const rows = (await (sql as any)`
    INSERT INTO bills (
      unit_id,
      billing_period_start,
      billing_period_end,
      due_date,
      status,
      total_amount,
      balance_amount
    )
    VALUES (
      ${unitId},
      ${billingPeriodStart},
      ${billingPeriodEnd},
      ${dueDate},
      'PENDING',
      ${totalAmount},
      ${totalAmount}
    )
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

