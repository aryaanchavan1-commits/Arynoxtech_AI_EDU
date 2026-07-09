"use client";

import { useState, useEffect } from "react";

const LEVEL_BADGES: Record<string, string> = { practiced: "🌱", level_1: "🔥", level_2: "⭐", mastered: "🏆" };
const LEVEL_COLORS: Record<string, string> = { practiced: "#6366f1", level_1: "#22d3ee", level_2: "#f59e0b", mastered: "#22c55e" };

export function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"energyPoints" | "lecturesCompleted" | "name">("energyPoints");

  useEffect(() => {
    fetch("/api/teacher").then(r => r.json()).then(d => {
      setStudents(d.students || []);
      setLoading(false);
    });
  }, []);

  const filtered = students
    .filter(s => !s.isBlocked && (s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => sortBy === "name" ? a.name?.localeCompare(b.name) : (b[sortBy] || 0) - (a[sortBy] || 0));

  const totalStudents = filtered.length;
  const avgLectures = totalStudents > 0 ? Math.round(filtered.reduce((s, u) => s + (u.lecturesCompleted || 0), 0) / totalStudents) : 0;
  const masteredCount = filtered.reduce((s, u) => s + (u.skillsMastered || 0), 0);
  const totalEnergy = filtered.reduce((s, u) => s + (u.energyPoints || 0), 0);

  if (loading) return <div className="text-zinc-500 animate-pulse">Loading student data...</div>;

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalStudents}</p>
          <p className="text-xs text-zinc-500 mt-1">Active Students</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{totalEnergy.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1">Total Energy Points</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{masteredCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Skills Mastered</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{avgLectures}</p>
          <p className="text-xs text-zinc-500 mt-1">Avg Lectures/Student</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search students..."
          className="input-field max-w-xs text-sm"
        />
        <div className="flex gap-1">
          {(["energyPoints", "lecturesCompleted", "name"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} className={`text-xs px-3 py-1.5 rounded-lg transition ${sortBy === s ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "text-zinc-500 hover:text-white"}`}>
              {s === "energyPoints" ? "Energy" : s === "lecturesCompleted" ? "Lectures" : "Name"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((s: any) => (
          <a key={s.id} href={`/admin/teacher/${s.id}`} className="block glass rounded-lg p-4 hover:bg-white/5 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{s.name}</p>
                <p className="text-xs text-zinc-500">{s.email} · {s.tier}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Lectures</p>
                  <p className="text-sm font-bold text-cyan-400">{s.lecturesCompleted || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Quizzes</p>
                  <p className="text-sm font-bold text-violet-400">{s.quizzesPassed || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Mastered</p>
                  <p className="text-sm font-bold text-green-400">{s.skillsMastered || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Modules</p>
                  <p className="text-sm font-bold text-yellow-400">{s.modulesCompleted || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{s.energyPoints || 0}</p>
                  <p className="text-[10px] text-zinc-600">EP</p>
                </div>
                <span className="text-xs text-zinc-600">→</span>
              </div>
            </div>
          </a>
        ))}
        {filtered.length === 0 && <p className="text-zinc-500 text-sm py-8 text-center">No students found.</p>}
      </div>
    </div>
  );
}