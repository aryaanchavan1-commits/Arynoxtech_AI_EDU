import { getDb, ensureDb } from "@/db";

export async function seedIfNeeded() {
  const ok = await ensureDb();
  if (!ok) return { seeded: false };
  return { seeded: false, skipped: true };
}