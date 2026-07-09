import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { liveClasses } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json([]);
    const rows = await _db.select().from(liveClasses).orderBy(liveClasses.createdAt);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { title, description } = await req.json();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const id = nanoid();
    await _db.insert(liveClasses).values({
      id, title: title || "Untitled Class", description: description || "",
      instructorId: (await requireAdmin()).id,
      status: "scheduled",
    });
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}