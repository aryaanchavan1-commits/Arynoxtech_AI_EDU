"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";

const LEVEL_LABELS: Record<string, string> = {
  practiced: "Practiced", level_1: "Level 1", level_2: "Level 2", mastered: "Mastered",
};
const LEVEL_COLORS: Record<string, string> = {
  practiced: "#6366f1", level_1: "#22d3ee", level_2: "#f59e0b", mastered: "#22c55e",
};
const LEVEL_BADGES: Record<string, string> = {
  practiced: "🌱", level_1: "🔥", level_2: "⭐", mastered: "🏆",
};

export default function ProgressPage() {
  const { user } = useSession();
  const [skillsData, setSkillsData] = useState<any[]>([]);
  const [modulesData, setModulesData] = useState<any[]>([]);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState(0);

  useEffect(() => {
    fetch("/api/mastery").then(r => r.json()).then(d => {
      setSkillsData(d.skills || []);
      setModulesData(d.modules || []);
    });
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setWeeklyActivity(d.streak || 0);
    });
  }, []);

  const totalEnergy = skillsData.reduce((s: number, sk: any) => s + (sk.energyPoints || 0), 0);
  const masteredSkills = skillsData.filter((s: any) => s.level === "mastered").length;
  const totalLecturesDone = skillsData.reduce((s: number, sk: any) => s + (sk.lecturesCompleted || 0), 0);

  return (
    <main className="min-h-screen pb-20">
      <Navbar user={user} />
      <div className="pt-20 max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Progress</h1>
            <p className="text-sm text-zinc-400 mt-1">{user?.name || "Student"}</p>
          </div>
          <div className="flex gap-4">
            <div className="glass rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold text-cyan-400">{totalEnergy}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Energy Points</p>
            </div>
            <div className="glass rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold text-green-400">{masteredSkills}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Mastered</p>
            </div>
            <div className="glass rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold text-violet-400">{totalLecturesDone}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Lectures</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {skillsData.length === 0 && (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">🚀</p>
              <p className="text-zinc-400">Start learning to see your progress here!</p>
            </div>
          )}

          {skillsData.map((skill: any) => {
            const mods = modulesData.filter((m: any) => m.skillId === skill.skillId);
            const isExpanded = expandedSkill === skill.skillId;

            return (
              <div key={skill.skillId || skill.id} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSkill(isExpanded ? null : skill.skillId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{LEVEL_BADGES[skill.level] || "🌱"}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{skill.skillName || "Skill"}</p>
                      <p className="text-xs text-zinc-500">
                        {skill.lecturesCompleted || 0} lectures · {skill.energyPoints || 0} energy points
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{
                        background: `${LEVEL_COLORS[skill.level] || "#6366f1"}22`,
                        color: LEVEL_COLORS[skill.level] || "#6366f1",
                        border: `1px solid ${LEVEL_COLORS[skill.level] || "#6366f1"}44`,
                      }}
                    >
                      {LEVEL_LABELS[skill.level] || "Practiced"}
                    </span>
                    <span className="text-zinc-600">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5 p-4 space-y-2">
                    {mods.map((mod: any) => {
                      const pct = mod.totalLectures > 0 ? Math.round((mod.lecturesCompleted / mod.totalLectures) * 100) : 0;
                      return (
                        <div key={mod.moduleId || mod.id} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                            background: mod.completed ? "#22c55e" : "rgba(255,255,255,0.1)",
                          }}>
                            {mod.completed ? "✓" : ""}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-300">{mod.moduleName || "Module"}</span>
                              <span className="text-zinc-500">{mod.lecturesCompleted}/{mod.totalLectures}</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
                              <div className="h-1.5 rounded-full transition-all" style={{
                                width: `${pct}%`,
                                background: mod.completed ? "#22c55e" : "#7c3aed",
                              }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}