import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type NotifRow = {
  id: number;
  title: string;
  body: string | null;
  type: string;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = (session.user as any).id;

  let lastId: number = 0;

  // Get the latest notification id at connection time
  const seed = (await (sql as any)`
    SELECT COALESCE(MAX(id), 0) AS max_id FROM notifications WHERE user_id = ${userId}
  `) as { max_id: number }[];
  lastId = seed[0]?.max_id ?? 0;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch {}
        }
      };

      // Send an initial heartbeat so the client knows we're connected
      send(JSON.stringify({ type: "connected" }));

      const poll = async () => {
        if (closed) return;
        try {
          const rows = (await (sql as any)`
            SELECT id, title, body, type, reference_id, is_read, created_at
            FROM notifications
            WHERE user_id = ${userId} AND id > ${lastId}
            ORDER BY id ASC
          `) as NotifRow[];

          for (const row of rows) {
            send(JSON.stringify(row));
            if (row.id > lastId) lastId = row.id;
          }
        } catch (err) {
          // DB error — don't crash the stream
        }
        if (!closed) setTimeout(poll, 4000); // poll every 4s
      };

      poll();

      req.signal.addEventListener("abort", () => {
        closed = true;
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
