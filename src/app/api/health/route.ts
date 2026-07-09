import { NextResponse } from "next/server";
import { getDb } from "@/db";

export async function GET() {
  const dbOk = !!getDb();
  return NextResponse.json({
    status: "ok",
    dbConnected: dbOk,
    node: process.version,
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasAuthToken: !!process.env.DATABASE_AUTH_TOKEN,
      hasAuth0: !!process.env.AUTH0_DOMAIN,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}