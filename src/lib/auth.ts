import { cookies } from "next/headers";
import { eq, and, gte } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { sessions, users, subscriptions, appSettings, type User } from "@/db/schema";

const SESSION_COOKIE = "arynox_session";
const SESSION_DAYS = 30;
const FREE_TIER: User["tier"] = "free_trial";

export async function checkSubscription(userId: string): Promise<string> {
  const _db = getDb();
  if (!_db) return "free_trial";
  try {
    const active = await _db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"), gte(subscriptions.endsAt, new Date().toISOString())))
      .orderBy(subscriptions.endsAt)
      .limit(1);
    if (active.length > 0) {
      return active[0].tier;
    }
  } catch {}
  return "free_trial";
}

export async function enforceSubscription(userId: string, currentTier: string): Promise<string> {
  if (currentTier === "free_trial" || currentTier === "admin") return currentTier;
  const validTier = await checkSubscription(userId);
  if (validTier !== currentTier) {
    const _db = getDb();
    if (_db) {
      await _db.update(users).set({ tier: validTier, subscriptionExpiresAt: null }).where(eq(users.id, userId));
    }
  }
  return validTier;
}

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

export async function destroySession(token?: string) {
  const cookieStore = await cookies();
  const t = token || cookieStore.get(SESSION_COOKIE)?.value;
  if (t) {
    const _db = getDb();
    if (_db) await _db.delete(sessions).where(eq(sessions.id, t));
    cookieStore.delete(SESSION_COOKIE);
  }
}

async function getSessionByToken(token: string) {
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
  return row;
}

export async function getSessionUser(req?: Request): Promise<User | null> {
  // Check Authorization header first (for mobile/desktop apps)
  if (req) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const row = await getSessionByToken(token);
      if (!row) return null;
      await updateSessionAndUser(row.user, row.sessionId);
      return row.user;
    }
  }

  // Fallback to cookie (for browser)
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await getSessionByToken(token);
  if (!row) return null;
  await updateSessionAndUser(row.user, row.sessionId);
  return row.user;
}

async function updateSessionAndUser(user: User, sessionId: string) {
  const _db = getDb();
  if (!_db) return;
  await _db.update(users).set({ lastActiveAt: new Date().toISOString() }).where(eq(users.id, user.id));
  if (user.role !== "admin") {
    const validTier = await enforceSubscription(user.id, user.tier);
    user.tier = validTier;
  }
}

export async function requireUser(req?: Request): Promise<User> {
  const user = await getSessionUser(req);
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.isBlocked) throw new Error("BLOCKED");
  return user;
}

export async function requireAdmin(req?: Request) {
  const user = await requireUser(req);
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export function publicUser(user: User) {
  return {
    id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl,
    role: user.role, tier: user.tier, isBlocked: user.isBlocked,
    freeVideosUsed: user.freeVideosUsed, freeAiUsed: user.freeAiUsed,
    streak: user.streak, totalPoints: user.totalPoints,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
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