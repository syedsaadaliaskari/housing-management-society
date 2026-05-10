import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "categories") {
    const rows = (await (sql as any)`
      SELECT id, name FROM inventory_categories ORDER BY name ASC
    `) as { id: number; name: string }[];
    return NextResponse.json(rows);
  }

  const rows = (await (sql as any)`
    SELECT
      i.id, i.name, i.description, i.quantity, i.unit,
      i.low_stock_threshold, i.location, i.purchase_price,
      i.is_active, i.updated_at,
      c.name AS category_name
    FROM inventory_items i
    LEFT JOIN inventory_categories c ON i.category_id = c.id
    ORDER BY i.name ASC
  `) as {
    id: number;
    name: string;
    description: string | null;
    quantity: number;
    unit: string | null;
    low_stock_threshold: number | null;
    location: string | null;
    purchase_price: string | null;
    is_active: boolean;
    updated_at: string;
    category_name: string | null;
  }[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    name,
    categoryId,
    description,
    quantity,
    unit,
    lowStockThreshold,
    location,
    purchasePrice,
  } = (await req.json()) as {
    name?: string;
    categoryId?: number | null;
    description?: string;
    quantity?: number;
    unit?: string;
    lowStockThreshold?: number;
    location?: string;
    purchasePrice?: number | null;
  };

  if (!name)
    return NextResponse.json(
      { error: "Item name is required" },
      { status: 400 },
    );

  const rows = (await (sql as any)`
    INSERT INTO inventory_items
      (name, category_id, description, quantity, unit, low_stock_threshold, location, purchase_price)
    VALUES
      (${name}, ${categoryId ?? null}, ${description ?? null},
       ${quantity ?? 0}, ${unit ?? "pcs"}, ${lowStockThreshold ?? 5},
       ${location ?? null}, ${purchasePrice ?? null})
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, value } = (await req.json()) as {
    id?: number;
    action?: "increment" | "decrement" | "set" | "deactivate";
    value?: number;
  };

  if (!id || !action)
    return NextResponse.json(
      { error: "Missing id or action" },
      { status: 400 },
    );

  if (action === "increment") {
    await (sql as any)`
      UPDATE inventory_items
      SET quantity = quantity + ${value ?? 1}, updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (action === "decrement") {
    await (sql as any)`
      UPDATE inventory_items
      SET quantity = GREATEST(0, quantity - ${value ?? 1}), updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (action === "set" && value !== undefined) {
    await (sql as any)`
      UPDATE inventory_items
      SET quantity = ${Math.max(0, value)}, updated_at = NOW()
      WHERE id = ${id}
    `;
  } else if (action === "deactivate") {
    await (sql as any)`
      UPDATE inventory_items SET is_active = false, updated_at = NOW() WHERE id = ${id}
    `;
  }

  return NextResponse.json({ ok: true });
}
