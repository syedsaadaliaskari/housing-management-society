import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type BookingRow = {
  id: number;
  amenity_name: string;
  member_name: string | null;
  unit_number: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
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

  const rows = (await (sql as any)`
    SELECT
      b.id,
      a.name AS amenity_name,
      m.first_name || ' ' || COALESCE(m.last_name, '') AS member_name,
      u.unit_number,
      b.booking_date,
      b.start_time,
      b.end_time,
      b.purpose,
      b.status,
      b.admin_notes,
      b.created_at
    FROM bookings b
    JOIN amenities a ON b.amenity_id = a.id
    LEFT JOIN members m ON b.member_id = m.id
    LEFT JOIN units u ON b.unit_id = u.id
    ORDER BY b.booking_date DESC, b.start_time DESC
  `) as BookingRow[];

  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, adminNotes } = (await req.json()) as {
    id?: number;
    status?: string;
    adminNotes?: string;
  };

  if (!id || !status)
    return NextResponse.json(
      { error: "Missing id or status" },
      { status: 400 },
    );

  const allowed = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];
  if (!allowed.includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  await (sql as any)`
    UPDATE bookings
    SET status = ${status}, admin_notes = ${adminNotes ?? null}
    WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
