import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, createSession } from "@/lib/auth";
import { moderateUsername } from "@/lib/moderation";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "All fields required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const modResult = moderateUsername(name);
    if (!modResult.allowed) return NextResponse.json({ error: modResult.reason }, { status: 400 });

    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not connected" }, { status: 500 });

    const existing = await _db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const id = nanoid();
    const hash = await hashPassword(password);
    await _db.insert(users).values({
      id, email: email.toLowerCase(), name, passwordHash: hash, role: "user", tier: "free_trial",
    });

    await createSession(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}