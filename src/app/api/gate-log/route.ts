import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type GateLogRow = {
  id: number;
  person_name: string;
  person_type: string;
  direction: string;
  vehicle_number: string | null;
  unit_ref: string | null;
  purpose: string | null;
  gate: string | null;
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
    SELECT id, person_name, person_type, direction,
           vehicle_number, unit_ref, purpose, gate, created_at
    FROM gate_logs
    ORDER BY created_at DESC
    LIMIT 500
  `) as GateLogRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    personName,
    personType,
    direction,
    vehicleNumber,
    unitRef,
    purpose,
    gate,
  } = body as {
    personName?: string;
    personType?: string;
    direction?: string;
    vehicleNumber?: string;
    unitRef?: string;
    purpose?: string;
    gate?: string;
  };

  if (!personName || !personType || !direction)
    return NextResponse.json(
      { error: "Name, type and direction are required" },
      { status: 400 },
    );

  if (!["IN", "OUT"].includes(direction))
    return NextResponse.json(
      { error: "Direction must be IN or OUT" },
      { status: 400 },
    );

  const userId = (session.user as any).id;

  const rows = (await (sql as any)`
    INSERT INTO gate_logs
      (person_name, person_type, direction, vehicle_number, unit_ref, purpose, gate, logged_by)
    VALUES
      (${personName}, ${personType}, ${direction}, ${vehicleNumber ?? null},
       ${unitRef ?? null}, ${purpose ?? null}, ${gate ?? "Main Gate"}, ${userId})
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json(rows[0], { status: 201 });
}
