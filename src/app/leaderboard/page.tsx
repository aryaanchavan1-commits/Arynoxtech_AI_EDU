"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";
import { TIER_CONFIG } from "@/lib/constants";

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  totalPoints: number;
  streak: number;
  tier: string;
  avatarUrl?: string;
}

export default function LeaderboardPage() {
  const { user, loading: sessionLoading } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch leaderboard");
        return r.json();
      })
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={user} />
      <div className="pt-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <p className="text-zinc-400 mt-1">Top learners this month</p>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                <div className="w-8 h-8 loading-shimmer rounded-full" />
                <div className="flex-1 h-4 loading-shimmer rounded w-32" />
                <div className="h-4 loading-shimmer rounded w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-8 text-center text-zinc-400">{error}</div>
        ) : entries.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-zinc-400">No data yet. Start learning to appear on the leaderboard!</div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-4 px-5 font-semibold"># Rank</th>
                  <th className="text-left py-4 px-5 font-semibold">Name</th>
                  <th className="text-right py-4 px-5 font-semibold">Points</th>
                  <th className="text-right py-4 px-5 font-semibold hidden sm:table-cell">Level</th>
                  <th className="text-right py-4 px-5 font-semibold hidden md:table-cell">Streak</th>
                  <th className="text-right py-4 px-5 font-semibold hidden lg:table-cell">Tier</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 50).map((entry, i) => {
                  const level = Math.floor(entry.totalPoints / 1000) + 1;
                  const tierConfig = TIER_CONFIG[entry.tier as keyof typeof TIER_CONFIG];
                  return (
                    <tr key={entry.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition ${user?.id === entry.id ? "bg-violet-500/5" : ""}`}>
                      <td className="py-3.5 px-5">
                        <span className={`font-bold ${i < 3 ? "text-yellow-400" : "text-zinc-300"}`}>{i + 1}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {entry.name?.charAt(0) || "?"}
                          </div>
                          <span className="text-white font-medium truncate">{entry.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right text-cyan-400 font-semibold">{entry.totalPoints.toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-right text-zinc-300 hidden sm:table-cell">{level}</td>
                      <td className="py-3.5 px-5 text-right text-orange-400 hidden md:table-cell">🔥 {entry.streak}</td>
                      <td className="py-3.5 px-5 text-right hidden lg:table-cell">
                        {tierConfig ? (
                          <span className="badge" style={{ background: tierConfig.color + "22", color: tierConfig.color }}>
                            {tierConfig.label}
                          </span>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
