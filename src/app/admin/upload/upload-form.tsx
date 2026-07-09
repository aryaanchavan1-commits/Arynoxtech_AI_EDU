"use client";

import { useState } from "react";

export function UploadForm({ skills, modules }: { skills: any[]; modules: any[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillId, setSkillId] = useState(skills[0]?.id || "");
  const [moduleId, setModuleId] = useState("");
  const [tierRequired, setTierRequired] = useState("free_trial");
  const [useBunny, setUseBunny] = useState(false);
  const [mp4Url, setMp4Url] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const filteredModules = modules.filter((m: any) => m.skillId === skillId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, skillId, moduleId: moduleId || null, tierRequired, mp4Url, uploadBunny: useBunny }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Lecture created successfully!");
        setTitle(""); setDescription(""); setMp4Url("");
      } else {
        setMessage(data.error || "Upload failed");
      }
    } catch (err: any) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" required />
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Skill</label>
          <select value={skillId} onChange={(e) => { setSkillId(e.target.value); setModuleId(""); }} className="input-field">
            {skills.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Module</label>
          <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="input-field">
            <option value="">No module</option>
            {filteredModules.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Tier Required</label>
        <select value={tierRequired} onChange={(e) => setTierRequired(e.target.value)} className="input-field">
          <option value="free_trial">Free Trial</option>
          <option value="basic">Basic</option>
          <option value="plus">Plus</option>
          <option value="premium">Premium</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="bunny" checked={useBunny} onChange={(e) => setUseBunny(e.target.checked)} />
        <label htmlFor="bunny" className="text-xs text-zinc-400">Use Bunny.net for upload</label>
      </div>
      {!useBunny && (
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Video URL (MP4)</label>
          <input value={mp4Url} onChange={(e) => setMp4Url(e.target.value)} className="input-field" placeholder="https://..." />
        </div>
      )}
      {message && <p className={`text-xs ${message.includes("success") ? "text-green-400" : "text-red-400"}`}>{message}</p>}
      <button type="submit" disabled={loading} className="btn-primary text-sm">{loading ? "Uploading..." : "Create Lecture"}</button>
    </form>
  );
}