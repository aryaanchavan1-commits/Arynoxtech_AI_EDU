"use client";

import { useState } from "react";
import { nanoid } from "nanoid";

export function ContentManager({ data }: { data: { skills: any[]; modules: any[]; lectures: any[] } }) {
  const [activeTab, setActiveTab] = useState<"skills" | "modules" | "lectures">("skills");
  const [items, setItems] = useState(data.skills);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSkillId, setNewSkillId] = useState(data.skills[0]?.id || "");
  const [message, setMessage] = useState("");

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Delete this item?")) return;
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    setItems((prev) => prev.filter((i: any) => i.id !== id));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!newTitle) { setMessage("Title is required"); return; }

    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: activeTab,
        title: newTitle,
        skillId: activeTab === "modules" ? newSkillId : undefined,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setMessage(`${activeTab.slice(0, -1)} created!`);
      setNewTitle("");
      setItems((prev) => [...prev, { id: d.id, title: newTitle, slug: newTitle.toLowerCase().replace(/\s+/g, "-") }]);
      setShowForm(false);
    } else {
      setMessage(d.error || "Failed");
    }
  };

  const tabData: Record<string, any[]> = { skills: data.skills, modules: data.modules, lectures: data.lectures };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {["skills", "modules", "lectures"].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as any); setItems(tabData[tab] || []); setShowForm(false); }}
            className={`text-sm px-4 py-2 rounded-lg transition ${activeTab === tab ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "text-zinc-400 hover:text-white"}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tabData[tab]?.length || 0})
          </button>
        ))}
      </div>

      <div className="mb-4">
        <button onClick={() => setShowForm(!showForm)} className="btn-secondary text-xs">
          {showForm ? "Cancel" : `+ Add ${activeTab.slice(0, -1)}`}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass rounded-xl p-4 mb-6 space-y-3 max-w-md">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Title</label>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="input-field" required />
          </div>
          {activeTab === "modules" && (
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Parent Skill</label>
              <select value={newSkillId} onChange={(e) => setNewSkillId(e.target.value)} className="input-field">
                {data.skills.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          )}
          {message && <p className="text-xs text-green-400">{message}</p>}
          <button type="submit" className="btn-primary text-sm">Create</button>
        </form>
      )}

      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.id} className="glass rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-200 font-medium">{item.title}</p>
              <p className="text-xs text-zinc-500">{item.slug}</p>
            </div>
            <div className="flex gap-2">
              {item.status && (
                <span className={`badge text-[10px] ${item.status === "published" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                  {item.status}
                </span>
              )}
              <button onClick={() => handleDelete(activeTab, item.id)} className="text-red-400 text-xs hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}