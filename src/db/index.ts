import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

let _instance: ReturnType<typeof drizzle> | null = null;
let _connected = false;

function init(): ReturnType<typeof drizzle> | null {
  if (_instance) return _instance;
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  if (!databaseUrl) return null;
  try {
    const client = createClient({ url: databaseUrl, authToken: authToken || undefined });
    _instance = drizzle(client);
    _connected = true;
    return _instance;
  } catch {
    _instance = null;
    _connected = false;
    return null;
  }
}

export function getDb(): ReturnType<typeof drizzle> | null {
  return init();
}

export function isDbConnected(): boolean {
  return _connected;
}

export async function ensureDb(): Promise<boolean> {
  init();
  return _connected;
}

export function resetDb(): void {
  _instance = null;
  _connected = false;
}