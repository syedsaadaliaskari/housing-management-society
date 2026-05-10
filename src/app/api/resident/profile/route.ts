import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;
  if (!session || !memberId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [member] = (await (sql as any)`
    SELECT id, first_name, last_name, email, phone_primary, phone_secondary
    FROM members
    WHERE id = ${memberId}
  `) as {
    id: number;
    first_name: string;
    last_name: string | null;
    email: string;
    phone_primary: string;
    phone_secondary: string | null;
  }[];

  if (!member)
    return NextResponse.json({ error: "Member not found" }, { status: 404 });

  return NextResponse.json(member);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;
  if (!session || !memberId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, phoneSecondary } = body as {
    firstName?: string;
    lastName?: string;
    phoneSecondary?: string | null;
  };

  if (!firstName)
    return NextResponse.json({ error: "First name required" }, { status: 400 });

  const [updated] = (await (sql as any)`
    UPDATE members
    SET
      first_name = ${firstName},
      last_name = ${lastName ?? null},
      phone_secondary = ${phoneSecondary ?? null}
    WHERE id = ${memberId}
    RETURNING id, first_name, last_name, email, phone_primary, phone_secondary
  `) as any[];

  return NextResponse.json(updated);
}
