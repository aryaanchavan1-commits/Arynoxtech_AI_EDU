import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, createSession, getSessionUser, publicUser } from "@/lib/auth";
import { json } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Email/password login — returns a session token
    if (email && password) {
      const _db = getDb();
      if (!_db) return json({ error: "Database not connected" }, { status: 500 });

      const rows = await _db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      const user = rows[0];
      if (!user || !user.passwordHash) return json({ error: "Invalid email or password" }, { status: 401 });
      if (user.isBlocked) return json({ error: "Account blocked" }, { status: 403 });
      if (!(await verifyPassword(password, user.passwordHash))) return json({ error: "Invalid email or password" }, { status: 401 });

      const token = await createSession(user.id);
      return json({ token, user: publicUser(user) });
    }

    // Token exchange — validate an existing session
    const user = await getSessionUser();
    if (!user) return json({ error: "Not authenticated" }, { status: 401 });

    return json({ user: publicUser(user) });
  } catch (err: any) {
    return json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
