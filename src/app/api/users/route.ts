import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type UserRow = {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  member_id: number | null;
  first_name: string | null;
  last_name: string | null;
  phone_primary: string | null;
  ownership_status: string | null;
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
      u.id,
      u.email,
      u.role,
      u.is_active,
      u.last_login_at,
      u.created_at,
      u.member_id,
      m.first_name,
      m.last_name,
      m.phone_primary,
      m.ownership_status
    FROM users u
    LEFT JOIN members m ON m.id = u.member_id
    ORDER BY u.created_at DESC
  `) as UserRow[];

  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, role, is_active } = body as {
    id?: number;
    role?: string;
    is_active?: boolean;
  };

  if (!id)
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const rows = (await (sql as any)`
    UPDATE users
    SET
      role      = COALESCE(${role ?? null}, role),
      is_active = COALESCE(${is_active ?? null}, is_active)
    WHERE id = ${id}
    RETURNING id, email, role, is_active, created_at
  `) as UserRow[];

  return NextResponse.json(rows[0]);
}
