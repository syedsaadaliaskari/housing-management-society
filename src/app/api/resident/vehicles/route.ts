import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type VehicleRow = {
  id: number;
  registration_number: string;
  vehicle_type: string | null;
  brand: string | null;
  color: string | null;
  sticker_number: string | null;
  unit_number: string | null;
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;
  if (!session || !memberId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = (await (sql as any)`
    SELECT
      v.id,
      v.registration_number,
      v.vehicle_type,
      v.brand,
      v.color,
      v.sticker_number,
      u.unit_number
    FROM vehicles v
    LEFT JOIN units u ON u.id = v.unit_id
    WHERE v.member_id = ${memberId}
    ORDER BY v.registration_number
  `) as VehicleRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;
  if (!session || !memberId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { registrationNumber, vehicleType, brand, color, stickerNumber } =
    body as {
      registrationNumber?: string;
      vehicleType?: string | null;
      brand?: string | null;
      color?: string | null;
      stickerNumber?: string | null;
    };

  if (!registrationNumber?.trim())
    return NextResponse.json(
      { error: "Registration number is required" },
      { status: 400 },
    );

  // Auto-resolve current unit
  const unitRows = (await (sql as any)`
    SELECT unit_id FROM unit_residents
    WHERE member_id = ${memberId} AND to_date IS NULL
    LIMIT 1
  `) as { unit_id: number }[];
  const unitId = unitRows[0]?.unit_id ?? null;

  try {
    const rows = (await (sql as any)`
      INSERT INTO vehicles (member_id, unit_id, registration_number, vehicle_type, brand, color, sticker_number)
      VALUES (
        ${memberId},
        ${unitId},
        ${registrationNumber.trim().toUpperCase()},
        ${vehicleType ?? null},
        ${brand ?? null},
        ${color ?? null},
        ${stickerNumber ?? null}
      )
      RETURNING id
    `) as { id: number }[];
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: any) {
    if (err?.message?.includes("unique") || err?.code === "23505")
      return NextResponse.json(
        { error: "This registration number is already registered." },
        { status: 409 },
      );
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;
  if (!session || !memberId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") ?? "");
  if (!id)
    return NextResponse.json({ error: "Missing vehicle id" }, { status: 400 });

  // Ensure the vehicle belongs to this resident
  const owned = (await (sql as any)`
    SELECT id FROM vehicles WHERE id = ${id} AND member_id = ${memberId}
  `) as { id: number }[];
  if (!owned.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await (sql as any)`DELETE FROM vehicles WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
