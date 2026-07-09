"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useState, useEffect } from "react";

export default function AdminLivePage() {
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/live").then(r => r.json()).then(setLiveClasses).catch(() => {});
  }, []);

  const createLiveClass = async () => {
    if (!title.trim()) return;
    const res = await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Live class created!");
      setTitle("");
      setDescription("");
      window.location.reload();
    } else {
      setMessage(data.error || "Failed");
    }
  };

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-white mb-6">Live Classes</h1>
      <div className="glass rounded-xl p-6 mb-6 max-w-xl">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Start a New Live Class</h2>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Class title" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={2} placeholder="Description" />
          <button onClick={createLiveClass} className="btn-primary text-sm">🔴 Start Live Class</button>
          {message && <p className="text-xs text-green-400">{message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        {liveClasses.map((lc: any) => (
          <div key={lc.id} className="glass rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-200 font-medium">{lc.title}</p>
              <p className="text-xs text-zinc-500">{lc.isLive ? "🔴 Live Now" : lc.status}</p>
            </div>
            {lc.isLive && <a href={lc.streamUrl} target="_blank" className="btn-primary text-xs py-1 px-3">Join</a>}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}