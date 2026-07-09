"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  pointsReward: number;
  expiresAt: string | null;
  userProgress?: number;
  completed?: boolean;
}

export default function ChallengesPage() {
  const { user, loading: sessionLoading } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchChallenges = () => {
    setLoading(true);
    fetch("/api/challenge")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch challenges");
        return r.json();
      })
      .then((data) => {
        setChallenges(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!sessionLoading && !user) return;
    fetchChallenges();
  }, [user, sessionLoading]);

  const handleComplete = async (challengeId: string, target: number) => {
    setCompleting(challengeId);
    setMessage("");
    try {
      const res = await fetch("/api/challenge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, progress: target }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Challenge completed! 🎉");
        fetchChallenges();
      } else {
        setMessage(data.error || "Failed to complete challenge.");
      }
    } catch {
      setMessage("Something went wrong.");
    }
    setCompleting(null);
  };

  if (sessionLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={user} />
      <div className="pt-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">Challenges</h1>
          <p className="text-zinc-400 mt-1">Complete challenges to earn rewards</p>
        </div>

        {message && (
          <div className="text-center mb-6">
            <span className="inline-block glass rounded-xl px-6 py-3 text-sm text-green-400">{message}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 space-y-3">
                <div className="h-5 loading-shimmer rounded w-3/4" />
                <div className="h-4 loading-shimmer rounded w-full" />
                <div className="h-3 loading-shimmer rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-8 text-center text-zinc-400">{error}</div>
        ) : challenges.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-zinc-400">No active challenges right now. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((c) => {
              const progress = c.userProgress ?? 0;
              const pct = c.target > 0 ? Math.min(100, Math.round((progress / c.target) * 100)) : 0;
              const done = c.completed || progress >= c.target;

              return (
                <div key={c.id} className={`glass rounded-xl p-6 flex flex-col ${done ? "opacity-70" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-semibold">{c.title}</h3>
                    <span className="badge bg-amber-500/20 text-amber-400 text-xs">{c.pointsReward} pts</span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-4 flex-1">{c.description}</p>

                  {!done && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                        <span>Progress</span>
                        <span>{progress} / {c.target}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  {done ? (
                    <span className="text-xs text-green-400 font-medium">✓ Completed</span>
                  ) : (
                    <button
                      onClick={() => handleComplete(c.id, c.target)}
                      disabled={completing === c.id}
                      className="btn-primary text-xs py-2 w-full"
                    >
                      {completing === c.id ? "Completing..." : "Complete"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
