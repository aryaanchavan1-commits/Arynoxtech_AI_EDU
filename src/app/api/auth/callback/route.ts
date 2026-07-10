import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth0Config, createSession } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", req.url));
  }

  const config = await getAuth0Config();
  if (!config.domain || !config.clientId || !config.clientSecret) {
    return NextResponse.redirect(new URL("/login?error=auth0_not_configured", req.url));
  }

  // Auto-detect the public URL from the request (handles Vercel, localhost, etc.)
  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(`https://${config.domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return NextResponse.redirect(new URL(`/login?error=token_exchange_failed`, req.url));
    }

    const tokenData = (await tokenRes.json()) as { access_token: string; id_token?: string };

    // Get user info from Auth0
    const userRes = await fetch(`https://${config.domain}/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL(`/login?error=userinfo_failed`, req.url));
    }

    const auth0User = (await userRes.json()) as {
      sub: string; email?: string; name?: string; picture?: string;
      email_verified?: boolean; nickname?: string;
    };

    const email = auth0User.email || `${auth0User.sub}@auth0.user`;
    const name = auth0User.name || auth0User.nickname || email.split("@")[0];
    const avatar = auth0User.picture || null;

    // Find or create user
    const _db = getDb();
    if (!_db) {
      return NextResponse.redirect(new URL(`/login?error=database_error`, req.url));
    }

    let user = await _db.select().from(users).where(eq(users.email, email)).limit(1);

    let userId: string;
    if (user[0]) {
      userId = user[0].id;
      await _db.update(users).set({
        name, avatarUrl: avatar || user[0].avatarUrl,
        oauthProvider: "auth0", oauthId: auth0User.sub,
        lastActiveAt: new Date().toISOString(),
      }).where(eq(users.id, userId));
    } else {
      userId = nanoid();
      await _db.insert(users).values({
        id: userId, email, name, avatarUrl: avatar,
        role: "user", oauthProvider: "auth0", oauthId: auth0User.sub,
      });
    }

    // Create session
    await createSession(userId);

    return NextResponse.redirect(new URL("/", req.url));
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message)}`, req.url));
  }
}