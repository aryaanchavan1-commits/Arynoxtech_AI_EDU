import Link from "next/link";
import type { Lecture } from "@/db/schema";

export function HeroBanner({ featured, continueItem }: { featured: Lecture | null; continueItem: Lecture | null }) {
  const item = continueItem || featured;
  if (!item) return <div className="h-64" />;

  return (
    <div className="relative w-full h-[70vh] min-h-[400px] max-h-[600px] overflow-hidden hero-mask">
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/90 via-[#0a0a0f]/40 to-transparent z-10" />
      <img
        src={item.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80"}
        alt={item.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-[15%] left-6 md:left-12 z-20 max-w-lg animate-fade-up">
        <h1 className="text-3xl md:text-5xl font-bold text-white text-gradient leading-tight">{item.title}</h1>
        <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{item.description || "AI-powered learning experience"}</p>
        <div className="flex gap-3 mt-5">
          <Link href={`/watch/${item.id}`} className="btn-primary text-sm">
            ▶ {continueItem ? "Continue" : "Watch Now"}
          </Link>
          {item.tierRequired !== "free_trial" && (
            <span className="badge bg-violet-600/30 text-violet-300 border border-violet-500/30 self-center">
              {item.tierRequired === "premium" ? "Premium" : item.tierRequired}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}