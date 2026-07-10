import Link from "next/link";
import { AppImage } from "@/components/AppImage";
import type { Lecture } from "@/db/schema";

export function ContentRow({ title, lectures }: { title: string; lectures: (Lecture & { progressPct?: number })[] }) {
  if (!lectures.length) return null;

  return (
    <section className="px-6 mt-6">
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      <div className="row-scroll">
        {lectures.map((lecture) => (
          <Link key={lecture.id} href={`/watch/${lecture.id}`} className="flex-shrink-0 w-[180px] card-hover group">
              <div className="relative rounded-lg overflow-hidden bg-zinc-900 aspect-video">
                <AppImage src={lecture.thumbnailUrl} alt={lecture.title} className="object-cover group-hover:scale-105 transition duration-300" />
              {"progressPct" in lecture && lecture.progressPct !== undefined && lecture.progressPct > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                  <div className="h-full bg-violet-500" style={{ width: `${lecture.progressPct}%` }} />
                </div>
              )}
              {lecture.tierRequired !== "free_trial" && (
                <div className="absolute top-2 right-2 badge bg-violet-500/80 text-white text-[10px]">{lecture.tierRequired}</div>
              )}
              {lecture.isNewRelease && (
                <div className="absolute top-2 left-2 badge bg-cyan-500/80 text-white text-[10px]">New</div>
              )}
            </div>
            <p className="text-sm text-zinc-300 mt-1.5 truncate font-medium">{lecture.title}</p>
            <p className="text-xs text-zinc-500">{Math.floor((lecture.durationSeconds || 0) / 60)} min</p>
          </Link>
        ))}
      </div>
    </section>
  );
}