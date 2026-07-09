import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getHomeCatalog } from "@/lib/data";

export async function GET(req: Request) {
  const user = await getSessionUser();
  const data = await getHomeCatalog(user);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  let lectures = data.rows.flatMap((r: any) => r.lectures || []);
  if (q) {
    const pattern = q.toLowerCase();
    lectures = lectures.filter((l: any) => l.title?.toLowerCase().includes(pattern) || l.description?.toLowerCase().includes(pattern));
  }

  return NextResponse.json({
    checkpoint: new Date().toISOString(),
    protocol: "arynox-rxdb-pull-v1",
    documents: {
      skills: data.skills,
      modules: data.rows.filter((r: any) => r.skill).map((r: any) => r.modules || []).flat(),
      lectures,
    },
  });
}