import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { sessions, users, appSettings, type User } from "@/db/schema";

const SESSION_COOKIE = "arynox_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const id = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  const _db = getDb();
  if (!_db) throw new Error("DATABASE_NOT_CONFIGURED");
  await _db.insert(sessions).values({ id, userId, expiresAt: expiresAt.toISOString() });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/", expires: expiresAt,
  });
  return id;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const _db = getDb();
    if (_db) await _db.delete(sessions).where(eq(sessions.id, token));
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const _db = getDb();
  if (!_db) return null;

  const rows = await _db
    .select({ sessionId: sessions.id, expiresAt: sessions.expiresAt, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    await _db.delete(sessions).where(eq(sessions.id, token));
    return null;
  }

  await _db.update(users).set({ lastActiveAt: new Date().toISOString() }).where(eq(users.id, row.user.id));
  return row.user;
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.isBlocked) throw new Error("BLOCKED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export function publicUser(user: User) {
  return {
    id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl,
    role: user.role, tier: user.tier, isBlocked: user.isBlocked,
    freeVideosUsed: user.freeVideosUsed, freeAiUsed: user.freeAiUsed,
    streak: user.streak, totalPoints: user.totalPoints,
    lastActiveAt: user.lastActiveAt, createdAt: user.createdAt,
  };
}

export async function getAuth0Config() {
  try {
    const _db = getDb();
    if (_db) {
      const rows = await _db.select().from(appSettings).where(eq(appSettings.id, "global")).limit(1);
      const s = rows[0];
      return {
        domain: s?.auth0Domain || process.env.AUTH0_DOMAIN || "",
        clientId: s?.auth0ClientId || process.env.AUTH0_CLIENT_ID || "",
        clientSecret: s?.auth0ClientSecret || process.env.AUTH0_CLIENT_SECRET || "",
      };
    }
  } catch {
    // fall through
  }
  return {
    domain: process.env.AUTH0_DOMAIN || "",
    clientId: process.env.AUTH0_CLIENT_ID || "",
    clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
  };
}