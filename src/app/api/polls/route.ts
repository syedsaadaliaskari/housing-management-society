import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

type PollRow = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
};

type OptionRow = {
  id: number;
  poll_id: number;
  option_text: string;
  sort_order: number;
};

type PollPayload = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  options: OptionRow[];
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

  const polls = (await (sql as any)`
    SELECT id, title, description, status, start_at, end_at, created_at
    FROM polls
    ORDER BY created_at DESC
  `) as PollRow[];

  if (polls.length === 0) {
    return NextResponse.json([]);
  }

  const pollIds = polls.map((p) => p.id);

  const options = (await (sql as any)`
    SELECT id, poll_id, option_text, sort_order
    FROM poll_options
    WHERE poll_id = ANY(${pollIds})
    ORDER BY poll_id, sort_order, id
  `) as OptionRow[];

  const optionsByPoll = new Map<number, OptionRow[]>();
  for (const option of options) {
    const existing = optionsByPoll.get(option.poll_id) ?? [];
    existing.push(option);
    optionsByPoll.set(option.poll_id, existing);
  }

  const payload: PollPayload[] = polls.map((p) => ({
    ...p,
    options: optionsByPoll.get(p.id) ?? [],
  }));

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    description,
    status,
    startAt,
    endAt,
    options,
  } = body as {
    title?: string;
    description?: string | null;
    status?: string;
    startAt?: string | null;
    endAt?: string | null;
    options?: string[];
  };

  if (!title || !status || !options || options.length === 0) {
    return NextResponse.json(
      { error: "Title, status, and at least one option are required" },
      { status: 400 }
    );
  }

  const createdBy = Number((session.user as any).id) || null;

  const [poll] = (await (sql as any)`
    INSERT INTO polls (title, description, status, start_at, end_at, created_by)
    VALUES (${title}, ${description ?? null}, ${status}, ${startAt ?? null}, ${endAt ?? null}, ${createdBy})
    RETURNING id
  `) as { id: number }[];

  const pollId = poll.id;

  let sortOrder = 0;
  for (const optionText of options) {
    // eslint-disable-next-line no-await-in-loop
    await (sql as any)`
      INSERT INTO poll_options (poll_id, option_text, sort_order)
      VALUES (${pollId}, ${optionText}, ${sortOrder})
    `;
    sortOrder += 1;
  }

  return NextResponse.json({ id: pollId }, { status: 201 });
}

