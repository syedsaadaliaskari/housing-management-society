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
    SELECT id, registration_number, vehicle_type, brand, color, sticker_number
    FROM vehicles
    ORDER BY registration_number
  `) as VehicleRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    memberId,
    unitId,
    registrationNumber,
    vehicleType,
    brand,
    color,
    stickerNumber,
  } = body as {
    memberId?: number;
    unitId?: number | null;
    registrationNumber?: string;
    vehicleType?: string | null;
    brand?: string | null;
    color?: string | null;
    stickerNumber?: string | null;
  };

  if (!memberId || !registrationNumber) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const rows = (await (sql as any)`
    INSERT INTO vehicles (member_id, unit_id, registration_number, vehicle_type, brand, color, sticker_number)
    VALUES (${memberId}, ${unitId ?? null}, ${registrationNumber}, ${vehicleType ?? null}, ${brand ?? null}, ${color ?? null}, ${stickerNumber ?? null})
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}

