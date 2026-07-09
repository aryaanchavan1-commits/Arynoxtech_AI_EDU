import { NextResponse } from "next/server";
import { getAuth0Config } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") || "google";

  const config = await getAuth0Config();
  if (!config.domain || !config.clientId) {
    return NextResponse.json({ error: "Auth0 not configured" }, { status: 400 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/auth/callback`;
  const url = `https://${config.domain}/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&connection=${provider}`;

  return NextResponse.json({ url });
}