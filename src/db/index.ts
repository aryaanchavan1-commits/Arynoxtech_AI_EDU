import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

let db: ReturnType<typeof drizzle> = null as any;
let connected = false;

function init() {
  if (connected) return;
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  if (!databaseUrl) return;
  try {
    const client = createClient({ url: databaseUrl, authToken });
    db = drizzle(client);
    connected = true;
  } catch {
    db = null as any;
  }
}

export { db };
export function getDb() {
  init();
  return db;
}
export function isDbConnected() { return connected; }
export async function ensureDb(): Promise<boolean> {
  init();
  return connected;
}