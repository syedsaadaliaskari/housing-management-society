import { sql } from "@/lib/db";

export async function sendNotification(
  userId: number,
  title: string,
  body: string | null,
  type: string,
  referenceId?: number,
) {
  await (sql as any)`
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (${userId}, ${title}, ${body}, ${type}, ${referenceId ?? null})
  `;
}
