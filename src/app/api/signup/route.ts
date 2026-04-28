import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phone, unitCode } = body as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      unitCode?: string;
    };

    // Validate required fields
    if (!email || !password || !firstName || !phone || !unitCode) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    // Check unit exists with the code
    const units = (await (sql as any)`
      SELECT id, unit_number
      FROM units
      WHERE unit_number = ${unitCode} AND is_active = TRUE
      LIMIT 1
    `) as { id: number; unit_number: string }[];

    if (units.length === 0) {
      return NextResponse.json(
        { error: "Invalid unit code. Please contact your administrator." },
        { status: 400 },
      );
    }

    const unit = units[0];

    // Check email not already registered
    const existingUsers = (await (sql as any)`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `) as { id: number }[];

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    // Create member
    const members = (await (sql as any)`
      INSERT INTO members (first_name, last_name, email, phone_primary, ownership_status)
      VALUES (
        ${firstName},
        ${lastName || null},
        ${email},
        ${phone},
        'TENANT'
      )
      RETURNING id
    `) as { id: number }[];

    const member = members[0];

    // Create user account
    await (sql as any)`
      INSERT INTO users (email, password_hash, role, member_id, is_active)
      VALUES (${email}, ${passwordHash}, 'RESIDENT', ${member.id}, TRUE)
    `;

    // Link member to unit
    await (sql as any)`
      INSERT INTO unit_residents (unit_id, member_id, role, is_primary_contact, from_date)
      VALUES (${unit.id}, ${member.id}, 'TENANT', TRUE, CURRENT_DATE)
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
