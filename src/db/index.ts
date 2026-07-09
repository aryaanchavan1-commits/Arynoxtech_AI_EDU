import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

let db: ReturnType<typeof drizzle> = null as any;
let connected = false;

function init() {
  if (connected || !databaseUrl) return;
  try {
    const client = createClient({ url: databaseUrl, authToken });
    db = drizzle(client);
    connected = true;
  } catch {
    db = null as any;
  }
}

init();

export { db };
export function getDb() {
  return db;
}
export function isDbConnected() { return connected; }
export async function ensureDb(): Promise<boolean> {
  if (connected && db) return true;
  init();
  return connected;
}