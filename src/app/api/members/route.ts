import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { User } from "lucide-react";

type MemberRow = {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_primary: string;
  ownership_status: string;
  created_at: string;
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
    SELECT id, first_name, last_name, email, phone_primary, ownership_status, created_at
    FROM members
    ORDER BY created_at DESC
  `) as MemberRow[];

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { firstName, lastName, email, phonePrimary, ownershipStatus } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phonePrimary?: string;
    ownershipStatus?: string;
  };

  if (!firstName || !email || !phonePrimary || !ownershipStatus) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const rows = (await (sql as any)`
    INSERT INTO members (first_name, last_name, email, phone_primary, ownership_status)
    VALUES (${firstName}, ${lastName || null}, ${email}, ${phonePrimary}, ${ownershipStatus})
    RETURNING id, first_name, last_name, email, phone_primary, ownership_status, created_at
  `) as MemberRow[];

  return NextResponse.json(rows[0], { status: 201 });
}

