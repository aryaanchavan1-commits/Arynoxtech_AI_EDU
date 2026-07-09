import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not connected" }, { status: 500 });

    const rows = await _db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    const user = rows[0];

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: "Your account has been blocked. Contact support." }, { status: 403 });
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}