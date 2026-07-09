import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  const _db = getDb();
  if (!_db) return NextResponse.json([]);
  const top = await _db.select().from(users).orderBy(desc(users.totalPoints)).limit(50);
  return NextResponse.json(top.map((u: any, i: number) => ({
    rank: i + 1,
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    totalPoints: u.totalPoints || 0,
    level: Math.floor((u.totalPoints || 0) / 1000) + 1,
    streak: u.streak || 0,
    tier: u.tier,
  })));
}