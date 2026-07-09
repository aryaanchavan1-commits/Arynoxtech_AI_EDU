"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ContentRow } from "@/components/ContentRow";
import { useSession } from "@/lib/client-session";

export default function BrowsePage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const { user } = useSession();

  useEffect(() => {
    fetch("/api/sync/pull").then((r) => r.json()).then((d) => setSkills(d.documents?.skills || []));
  }, []);

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={user} />
      <div className="pt-20 px-6">
        <h1 className="text-2xl font-bold text-gradient">Browse All Skills</h1>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-4">
          <button onClick={() => setSelectedSkill(null)} className={`btn-${selectedSkill === null ? "primary" : "secondary"} text-xs whitespace-nowrap`}>All</button>
          {skills.map((s: any) => (
            <button key={s.id} onClick={() => setSelectedSkill(s.id)} className={`btn-${selectedSkill === s.id ? "primary" : "secondary"} text-xs whitespace-nowrap`}>{s.title}</button>
          ))}
        </div>
        {skills.filter((s) => !selectedSkill || s.id === selectedSkill).map((skill: any) => (
          <div key={skill.id} className="mt-8">
            <h2 className="text-xl font-semibold text-white" style={{ borderLeft: `4px solid ${skill.accentColor || "#7c3aed"}`, paddingLeft: 12 }}>{skill.title}</h2>
            {skill.modules?.map((mod: any) => (
              <div key={mod.id} className="ml-4 mt-4 glass rounded-xl p-4">
                <h3 className="text-sm font-medium text-zinc-300">{mod.title}</h3>
                <p className="text-xs text-zinc-500 mt-1">{mod.description}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}