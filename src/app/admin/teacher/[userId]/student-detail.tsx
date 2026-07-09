"use client";

import { useState, useEffect } from "react";

const LEVEL_BADGES: Record<string, string> = { practiced: "🌱", level_1: "🔥", level_2: "⭐", mastered: "🏆" };
const LEVEL_COLORS: Record<string, string> = { practiced: "#6366f1", level_1: "#22d3ee", level_2: "#f59e0b", mastered: "#22c55e" };
const LEVEL_LABELS: Record<string, string> = { practiced: "Practiced", level_1: "Level 1", level_2: "Level 2", mastered: "Mastered" };

export function StudentDetail({ userId }: { userId: string }) {
  const [student, setStudent] = useState<any>(null);
  const [mastery, setMastery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher").then(r => r.json()),
      fetch(`/api/mastery?userId=${userId}`).then(r => r.json()),
    ]).then(([studentsData, masteryData]) => {
      const found = studentsData.students?.find((s: any) => s.id === userId);
      setStudent(found);
      setMastery(masteryData.skills || []);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="text-zinc-500 animate-pulse">Loading student data...</div>;
  if (!student) return <div className="text-red-400">Student not found.</div>;

  return (
    <div>
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-violet-600/30 flex items-center justify-center text-xl font-bold text-violet-300">
            {student.name?.[0] || "?"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{student.name}</h2>
            <p className="text-sm text-zinc-400">{student.email}</p>
            <div className="flex gap-3 mt-1 text-xs">
              <span className="text-zinc-500">Tier: {student.tier}</span>
              <span className="text-zinc-500">Joined: {student.createdAt?.slice(0, 10)}</span>
              <span className="text-zinc-500">Streak: {student.streak} days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{student.lecturesCompleted || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Lectures Done</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{student.quizzesPassed || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Quizzes Passed</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{student.skillsMastered || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Skills Mastered</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{student.energyPoints || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Energy Points</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-4">Skill Mastery Progress</h3>
      <div className="space-y-3">
        {mastery.map((m: any) => (
          <div key={m.skillId || m.id} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{LEVEL_BADGES[m.level] || "🌱"}</span>
                <span className="text-sm font-medium text-white">{m.skillName || m.skillId}</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{
                background: `${LEVEL_COLORS[m.level] || "#6366f1"}22`,
                color: LEVEL_COLORS[m.level] || "#6366f1",
                border: `1px solid ${LEVEL_COLORS[m.level] || "#6366f1"}44`,
              }}>
                {LEVEL_LABELS[m.level] || "Practiced"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div><span className="text-zinc-500">Lectures: </span><span className="text-white font-medium">{m.lecturesCompleted}</span></div>
              <div><span className="text-zinc-500">Quizzes: </span><span className="text-white font-medium">{m.quizzesPassed}</span></div>
              <div><span className="text-zinc-500">Energy: </span><span className="text-cyan-400 font-medium">{m.energyPoints} EP</span></div>
            </div>
          </div>
        ))}
        {mastery.length === 0 && <p className="text-zinc-500 text-sm">No skill progress yet.</p>}
      </div>
    </div>
  );
}