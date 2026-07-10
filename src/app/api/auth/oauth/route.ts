import { NextResponse } from "next/server";
import { getAuth0Config } from "@/lib/auth";

const CONNECTION_MAP: Record<string, string> = {
  google: "google-oauth2",
  github: "github",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") || "google";

  const config = await getAuth0Config();
  if (!config.domain || !config.clientId) {
    return NextResponse.json({ error: "Auth0 not configured" }, { status: 400 });
  }

  // Auto-detect the public URL from the request (handles Vercel, localhost, etc.)
  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  const connection = CONNECTION_MAP[provider] || provider;
  const url = `https://${config.domain}/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&connection=${connection}`;

  return NextResponse.json({ url });
}
