import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { billingMonth, dueDays = 15 } = body as {
    billingMonth?: string; // "YYYY-MM"
    dueDays?: number;
  };

  if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth))
    return NextResponse.json(
      { error: "billingMonth required in YYYY-MM format" },
      { status: 400 },
    );

  const [year, month] = billingMonth.split("-").map(Number);
  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
  const dueDate = (() => {
    const d = new Date(year, month - 1, dueDays);
    return d.toISOString().split("T")[0];
  })();

  // Get all active units with default charges
  type UnitRow = {
    id: number;
    unit_number: string;
    default_maint_charge: string;
    default_utility_charge: string;
  };

  const units = (await (sql as any)`
    SELECT id, unit_number, default_maint_charge, default_utility_charge
    FROM units
    WHERE is_active = TRUE
  `) as UnitRow[];

  if (units.length === 0)
    return NextResponse.json(
      { error: "No active units found" },
      { status: 404 },
    );

  let generated = 0;
  let skipped = 0;
  const results: { unitNumber: string; status: string; billId?: number }[] = [];

  for (const unit of units) {
    // Check if bill already exists for this unit + period
    const existing = (await (sql as any)`
      SELECT id FROM bills
      WHERE unit_id = ${unit.id}
        AND billing_period_start = ${periodStart}
        AND billing_period_end = ${periodEnd}
      LIMIT 1
    `) as { id: number }[];

    if (existing.length > 0) {
      skipped++;
      results.push({ unitNumber: unit.unit_number, status: "SKIPPED" });
      continue;
    }

    const totalAmount =
      parseFloat(unit.default_maint_charge || "0") +
      parseFloat(unit.default_utility_charge || "0");

    if (totalAmount <= 0) {
      skipped++;
      results.push({ unitNumber: unit.unit_number, status: "SKIPPED_ZERO" });
      continue;
    }

    const rows = (await (sql as any)`
      INSERT INTO bills (
        unit_id, billing_period_start, billing_period_end,
        due_date, status, total_amount, balance_amount
      )
      VALUES (
        ${unit.id}, ${periodStart}, ${periodEnd},
        ${dueDate}, 'PENDING', ${totalAmount}, ${totalAmount}
      )
      RETURNING id
    `) as { id: number }[];

    generated++;
    results.push({
      unitNumber: unit.unit_number,
      status: "GENERATED",
      billId: rows[0].id,
    });
  }

  return NextResponse.json({
    generated,
    skipped,
    billingPeriod: `${periodStart} → ${periodEnd}`,
    dueDate,
    results,
  });
}
