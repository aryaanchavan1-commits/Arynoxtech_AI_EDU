import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    return NextResponse.json(publicUser(user));
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}