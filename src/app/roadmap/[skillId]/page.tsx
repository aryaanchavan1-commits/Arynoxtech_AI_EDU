"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  iconEmoji: string | null;
  color: string | null;
  sortOrder: number;
  estimatedMinutes: number | null;
  lecturesRequired: number;
  pointsReward: number | null;
  completed?: boolean;
  progress?: number;
}

export default function RoadmapPage() {
  const params = useParams();
  const skillId = params.skillId as string;
  const { user, loading: sessionLoading } = useSession();
  const [skill, setSkill] = useState<any>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionLoading || !skillId) return;
    fetch(`/api/roadmap?skillId=${skillId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load roadmap");
        return r.json();
      })
      .then((data) => {
        const list = data.milestones || data || [];
        setMilestones(Array.isArray(list) ? list : []);
      })
      .catch((e) => setError(e.message));

    fetch("/api/sync/pull")
      .then((r) => r.json())
      .then((data) => {
        const skills = data?.documents?.skills || [];
        const found = skills.find((s: any) => s.id === skillId);
        if (found) setSkill(found);
      })
      .catch(() => {});

    setLoading(false);
  }, [skillId, sessionLoading]);

  if (sessionLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse">Loading roadmap...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <Navbar user={user} />
      <div className="pt-24 px-6 max-w-4xl mx-auto">
        {/* Skill header */}
        <div className="mb-10">
          {skill?.bannerUrl && (
            <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-6 hero-mask">
              <img
                src={skill.bannerUrl}
                alt={skill.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-white">
            {skill?.title || "Skill Roadmap"}
          </h1>
          {skill?.description && (
            <p className="text-zinc-400 mt-2 max-w-2xl">{skill.description}</p>
          )}
          <p className="text-sm text-zinc-500 mt-2">
            {milestones.length} milestone{milestones.length !== 1 ? "s" : ""} to
            complete
          </p>
        </div>

        {error ? (
          <div className="glass rounded-2xl p-8 text-center text-zinc-400">
            {error}
          </div>
        ) : milestones.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-zinc-400">
            No milestones defined for this skill yet.
          </div>
        ) : (
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-[26px] top-0 bottom-0 w-0.5 bg-zinc-700/60" />

            <div className="space-y-6">
              {milestones
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((ms, idx) => {
                  const done = ms.completed || (ms.progress ?? 0) >= 1;
                  const emoji = ms.iconEmoji || "🎯";
                  const color = ms.color || "#7c3aed";
                  const mins = ms.estimatedMinutes ?? 0;
                  const pts = ms.pointsReward ?? 0;

                  return (
                    <div key={ms.id} className="relative flex gap-5 group">
                      {/* Timeline dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all duration-300 ${
                            done
                              ? "bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20"
                              : "bg-zinc-800/80 border-zinc-600 group-hover:border-violet-500/50"
                          }`}
                        >
                          <span className={done ? "drop-shadow-lg" : ""}>
                            {done ? "✅" : emoji}
                          </span>
                        </div>
                        {/* connector to card */}
                        <div
                          className={`absolute top-6 left-12 h-0.5 w-4 ${
                            done ? "bg-green-500/40" : "bg-zinc-700/40"
                          }`}
                        />
                      </div>

                      {/* Card */}
                      <div
                        className={`flex-1 glass rounded-xl p-5 transition-all duration-300 border ${
                          done
                            ? "border-green-500/25 bg-green-500/5"
                            : "border-white/5 hover:border-violet-500/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {!done && (
                                <span className="text-xl">{emoji}</span>
                              )}
                              <h3 className="text-white font-semibold text-base truncate">
                                {ms.title}
                              </h3>
                            </div>
                            {ms.description && (
                              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                                {ms.description}
                              </p>
                            )}
                          </div>

                          {/* Points badge */}
                          <div
                            className="flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold"
                            style={{
                              backgroundColor: `${color}20`,
                              color: color,
                            }}
                          >
                            +{pts} pts
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-zinc-500">
                          {mins > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {mins} min
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            {ms.lecturesRequired} lecture
                            {ms.lecturesRequired !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* User progress */}
                        {user && !done && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                              <span>Progress</span>
                              <span>
                                {ms.progress ?? 0} / {ms.lecturesRequired}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ((ms.progress ?? 0) / ms.lecturesRequired) *
                                      100
                                  )}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {done && (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-green-400 font-medium">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
