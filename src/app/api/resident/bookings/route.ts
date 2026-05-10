import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type ResidentBookingRow = {
  id: number;
  amenity_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;
  if (!session || !memberId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = (await (sql as any)`
    SELECT
      b.id,
      a.name AS amenity_name,
      b.booking_date,
      b.start_time,
      b.end_time,
      b.purpose,
      b.status,
      b.admin_notes,
      b.created_at
    FROM bookings b
    JOIN amenities a ON b.amenity_id = a.id
    WHERE b.member_id = ${memberId}
    ORDER BY b.booking_date DESC
  `) as ResidentBookingRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;
  if (!session || !memberId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amenityId, bookingDate, startTime, endTime, purpose } =
    (await req.json()) as {
      amenityId?: number;
      bookingDate?: string;
      startTime?: string;
      endTime?: string;
      purpose?: string;
    };

  if (!amenityId || !bookingDate || !startTime || !endTime)
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 },
    );

  // Check amenity is active
  const amenityRows = (await (sql as any)`
    SELECT id FROM amenities WHERE id = ${amenityId} AND is_active = true LIMIT 1
  `) as { id: number }[];
  if (!amenityRows.length)
    return NextResponse.json(
      { error: "Amenity not available" },
      { status: 400 },
    );

  // Check for conflicts
  const conflicts = (await (sql as any)`
    SELECT id FROM bookings
    WHERE amenity_id = ${amenityId}
      AND booking_date = ${bookingDate}
      AND status IN ('PENDING', 'APPROVED')
      AND (start_time, end_time) OVERLAPS (${startTime}::time, ${endTime}::time)
    LIMIT 1
  `) as { id: number }[];
  if (conflicts.length)
    return NextResponse.json(
      { error: "This time slot is already booked" },
      { status: 409 },
    );

  const unitRows = (await (sql as any)`
    SELECT unit_id FROM unit_residents WHERE member_id = ${memberId} AND to_date IS NULL LIMIT 1
  `) as { unit_id: number }[];
  const unitId = unitRows[0]?.unit_id ?? null;

  const rows = (await (sql as any)`
    INSERT INTO bookings (amenity_id, member_id, unit_id, booking_date, start_time, end_time, purpose, status)
    VALUES (${amenityId}, ${memberId}, ${unitId}, ${bookingDate}, ${startTime}, ${endTime}, ${purpose ?? null}, 'PENDING')
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}
