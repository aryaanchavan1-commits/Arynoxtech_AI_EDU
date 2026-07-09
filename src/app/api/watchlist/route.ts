import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [] });

  const items = await db.select().from(watchlist).where(eq(watchlist.userId, user.id));
  return NextResponse.json({ items });
}