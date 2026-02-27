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
};

type OptionRow = {
  id: number;
  poll_id: number;
  option_text: string;
  sort_order: number;
};

type ResidentPoll = PollRow & {
  options: OptionRow[];
  has_voted: boolean;
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const polls = (await (sql as any)`
    SELECT id, title, description, status, start_at, end_at
    FROM polls
    WHERE status = 'OPEN'
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

  const votes = (await (sql as any)`
    SELECT poll_id
    FROM poll_votes
    WHERE member_id = ${memberId} AND poll_id = ANY(${pollIds})
  `) as { poll_id: number }[];

  const votedPollIds = new Set(votes.map((v) => v.poll_id));

  const optionsByPoll = new Map<number, OptionRow[]>();
  for (const option of options) {
    const existing = optionsByPoll.get(option.poll_id) ?? [];
    existing.push(option);
    optionsByPoll.set(option.poll_id, existing);
  }

  const payload: ResidentPoll[] = polls.map((p) => ({
    ...p,
    options: optionsByPoll.get(p.id) ?? [],
    has_voted: votedPollIds.has(p.id),
  }));

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId as number | undefined;

  if (!session || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { pollId, optionId } = body as {
    pollId?: number;
    optionId?: number;
  };

  if (!pollId || !optionId) {
    return NextResponse.json(
      { error: "Missing poll or option" },
      { status: 400 }
    );
  }

  // one vote per member per poll; rely on UNIQUE constraint for enforcement
  try {
    await (sql as any)`
      INSERT INTO poll_votes (poll_id, option_id, member_id)
      VALUES (${pollId}, ${optionId}, ${memberId})
    `;
  } catch {
    return NextResponse.json(
      { error: "You have already voted in this poll" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

