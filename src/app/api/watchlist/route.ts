import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/db";
import { watchlist } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [] });

  const _db = getDb();
  if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  const items = await _db.select().from(watchlist).where(eq(watchlist.userId, user.id));
  return NextResponse.json({ items });
}