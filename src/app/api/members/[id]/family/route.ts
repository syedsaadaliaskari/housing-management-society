import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

type FamilyMember = {
  id: number;
  member_id: number;
  full_name: string;
  relation: string;
  age: number | null;
  phone: string | null;
};

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rows = (await (sql as any)`
    SELECT id, member_id, full_name, relation, age, phone
    FROM member_family_members
    WHERE member_id = ${Number(id)}
    ORDER BY id ASC
  `) as FamilyMember[];

  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { fullName, relation, age, phone } = body as {
    fullName?: string;
    relation?: string;
    age?: number | null;
    phone?: string | null;
  };

  if (!fullName || !relation)
    return NextResponse.json(
      { error: "full_name and relation are required" },
      { status: 400 },
    );

  const rows = (await (sql as any)`
    INSERT INTO member_family_members (member_id, full_name, relation, age, phone)
    VALUES (${Number(id)}, ${fullName}, ${relation}, ${age ?? null}, ${phone ?? null})
    RETURNING id, member_id, full_name, relation, age, phone
  `) as FamilyMember[];

  return NextResponse.json(rows[0], { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  if (!familyId)
    return NextResponse.json({ error: "familyId required" }, { status: 400 });

  await (sql as any)`
    DELETE FROM member_family_members
    WHERE id = ${Number(familyId)} AND member_id = ${Number(id)}
  `;

  return NextResponse.json({ deleted: true });
}
