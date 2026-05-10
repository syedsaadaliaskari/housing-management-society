import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type AmenityRow = {
  id: number;
  name: string;
  description: string | null;
  capacity: number | null;
  open_time: string | null;
  close_time: string | null;
  booking_fee: string;
  is_active: boolean;
  created_at: string;
};

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = (await (sql as any)`
    SELECT id, name, description, capacity, open_time, close_time, booking_fee, is_active, created_at
    FROM amenities
    ORDER BY is_active DESC, name ASC
  `) as AmenityRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, capacity, openTime, closeTime, bookingFee } =
    (await req.json()) as {
      name?: string;
      description?: string;
      capacity?: number | null;
      openTime?: string | null;
      closeTime?: string | null;
      bookingFee?: number;
    };

  if (!name)
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const rows = (await (sql as any)`
    INSERT INTO amenities (name, description, capacity, open_time, close_time, booking_fee)
    VALUES (${name}, ${description ?? null}, ${capacity ?? null},
            ${openTime ?? null}, ${closeTime ?? null}, ${bookingFee ?? 0})
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, isActive } = (await req.json()) as {
    id?: number;
    isActive?: boolean;
  };
  if (id === undefined || isActive === undefined)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await (sql as any)`UPDATE amenities SET is_active = ${isActive} WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
