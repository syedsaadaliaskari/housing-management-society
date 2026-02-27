import postgres from "postgres";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}
export const sql = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
export async function closeDb() {
  await sql.end({ timeout: 5 });
}

