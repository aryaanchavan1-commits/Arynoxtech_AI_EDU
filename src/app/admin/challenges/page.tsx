"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/client-session";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  type: string;
  target: number;
  pointsReward: number;
  expiresAt: string | null;
  createdAt: string;
}

const CHALLENGE_TYPES = [
  "watch_lectures",
  "complete_quizzes",
  "login_streak",
  "earn_points",
] as const;

const SEED_CHALLENGES = [
  { title: "Movie Night!", description: "Watch 3 lectures", type: "watch_lectures", target: 3, pointsReward: 150 },
  { title: "Quiz King", description: "Complete 5 quizzes correctly", type: "complete_quizzes", target: 5, pointsReward: 200 },
  { title: "On Fire!", description: "3-day login streak", type: "login_streak", target: 3, pointsReward: 100 },
  { title: "Super Learner", description: "Complete one full skill module", type: "watch_lectures", target: 1, pointsReward: 300 },
  { title: "Point Collector", description: "Earn 500 total points", type: "earn_points", target: 500, pointsReward: 250 },
];

export default function AdminChallengesPage() {
  const { user } = useSession();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("watch_lectures");
  const [target, setTarget] = useState<number>(1);
  const [pointsReward, setPointsReward] = useState<number>(100);
  const [expiresAt, setExpiresAt] = useState("");

  const [seeding, setSeeding] = useState(false);

  const fetchChallenges = () => {
    setLoading(true);
    fetch("/api/challenge")
      .then((r) => r.json())
      .then((data) => {
        setChallenges(data.challenges || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!title.trim()) {
      setMessage("Title is required");
      return;
    }

    const res = await fetch("/api/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        type,
        target,
        pointsReward,
        expiresAt: expiresAt || null,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`Challenge "${title}" created!`);
      setTitle("");
      setDescription("");
      setType("watch_lectures");
      setTarget(1);
      setPointsReward(100);
      setExpiresAt("");
      fetchChallenges();
    } else {
      setMessage(data.error || "Failed to create challenge");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this challenge?")) return;
    setMessage("");
    const res = await fetch(`/api/challenge?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMessage("Challenge deleted.");
      setChallenges((prev) => prev.filter((c) => c.id !== id));
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to delete");
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setMessage("");
    let created = 0;
    for (const seed of SEED_CHALLENGES) {
      try {
        const res = await fetch("/api/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...seed,
            type: seed.type,
            target: seed.target,
            pointsReward: seed.pointsReward,
            expiresAt: null,
          }),
        });
        if (res.ok) created++;
      } catch {}
    }
    setMessage(`✅ Created ${created}/${SEED_CHALLENGES.length} kid challenges!`);
    setSeeding(false);
    fetchChallenges();
  };

  const typeLabels: Record<string, string> = {
    watch_lectures: "🎬 Watch Lectures",
    complete_quizzes: "⭐ Complete Quizzes",
    login_streak: "🔥 Login Streak",
    earn_points: "💪 Earn Points",
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Challenges</h1>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="btn-secondary text-xs"
        >
          {seeding ? "Seeding..." : "🌱 Seed Kid Challenges"}
        </button>
      </div>

      {message && (
        <div
          className={`text-sm mb-4 px-4 py-2 rounded-lg ${
            message.includes("✅") || message.includes("created") || message.includes("deleted")
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message}
        </div>
      )}

      {/* Create form */}
      <div className="glass rounded-xl p-6 mb-8 max-w-xl">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Create New Challenge
        </h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Movie Night!"
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="Watch 3 lectures"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field"
            >
              {CHALLENGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t] || t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">
                Target
              </label>
              <input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">
                Points Reward
              </label>
              <input
                type="number"
                min={1}
                value={pointsReward}
                onChange={(e) => setPointsReward(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Expires At
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="input-field"
            />
          </div>
          <button type="submit" className="btn-primary text-sm">
            Create Challenge
          </button>
        </form>
      </div>

      {/* Challenges table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-zinc-400 font-medium px-4 py-3">
                  Title
                </th>
                <th className="text-left text-zinc-400 font-medium px-4 py-3">
                  Description
                </th>
                <th className="text-left text-zinc-400 font-medium px-4 py-3">
                  Type
                </th>
                <th className="text-left text-zinc-400 font-medium px-4 py-3">
                  Target
                </th>
                <th className="text-left text-zinc-400 font-medium px-4 py-3">
                  Points
                </th>
                <th className="text-left text-zinc-400 font-medium px-4 py-3">
                  Expires
                </th>
                <th className="text-right text-zinc-400 font-medium px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    Loading...
                  </td>
                </tr>
              ) : challenges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No challenges yet. Create one above.
                  </td>
                </tr>
              ) : (
                challenges.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition"
                  >
                    <td className="px-4 py-3 text-zinc-200 font-medium">
                      {c.title}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs max-w-[200px] truncate">
                      {c.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-violet-500/20 text-violet-300 text-[10px]">
                        {typeLabels[c.type] || c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{c.target}</td>
                    <td className="px-4 py-3 text-amber-400 font-medium">
                      +{c.pointsReward}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {c.expiresAt
                        ? new Date(c.expiresAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-400 text-xs hover:text-red-300 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
