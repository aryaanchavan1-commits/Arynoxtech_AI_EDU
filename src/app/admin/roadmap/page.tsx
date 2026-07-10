"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useState, useEffect } from "react";

interface Milestone {
  id: string;
  skillId: string;
  title: string;
  description: string | null;
  iconEmoji: string | null;
  color: string | null;
  sortOrder: number;
  estimatedMinutes: number | null;
  lecturesRequired: number;
  pointsReward: number | null;
  status: string;
  lectureCount?: number;
}

interface Skill {
  id: string;
  title: string;
}

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-500/20 text-green-300",
  draft: "bg-yellow-500/20 text-yellow-300",
  archived: "bg-zinc-500/20 text-zinc-400",
};

const INIT_FORM = {
  title: "",
  description: "",
  iconEmoji: "🎯",
  color: "#7c3aed",
  sortOrder: 0,
  estimatedMinutes: 0,
  lecturesRequired: 1,
  pointsReward: 50,
};

export default function AdminRoadmapPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...INIT_FORM });

  useEffect(() => {
    fetch("/api/admin/content?type=skills")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.skills || [];
        setSkills(list);
        if (list.length > 0 && !selectedSkillId) setSelectedSkillId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSkillId) return;
    setLoading(true);
    fetch(`/api/admin/roadmap?skillId=${selectedSkillId}`)
      .then((r) => r.json())
      .then((data) => {
        setMilestones(Array.isArray(data) ? data : data.milestones || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedSkillId]);

  const resetForm = () => {
    setForm({ ...INIT_FORM });
    setEditId(null);
    setShowForm(false);
    setMessage("");
  };

  const openEdit = (m: Milestone) => {
    setEditId(m.id);
    setForm({
      title: m.title,
      description: m.description || "",
      iconEmoji: m.iconEmoji || "🎯",
      color: m.color || "#7c3aed",
      sortOrder: m.sortOrder,
      estimatedMinutes: m.estimatedMinutes || 0,
      lecturesRequired: m.lecturesRequired,
      pointsReward: m.pointsReward || 50,
    });
    setShowForm(true);
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!form.title.trim()) { setMessage("Title is required"); return; }

    const method = editId ? "PUT" : "POST";
    const body = editId
      ? { id: editId, ...form }
      : { skillId: selectedSkillId, ...form };

    const res = await fetch("/api/admin/roadmap", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(editId ? "Milestone updated!" : "Milestone created!");
      const r2 = await fetch(`/api/admin/roadmap?skillId=${selectedSkillId}`);
      const d2 = await r2.json();
      setMilestones(Array.isArray(d2) ? d2 : d2.milestones || []);
      resetForm();
    } else {
      setMessage(data.error || "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    const res = await fetch("/api/admin/roadmap", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-white mb-6">Roadmap Milestones</h1>

      <div className="glass rounded-xl p-6 mb-6">
        <label className="text-xs text-zinc-400 mb-2 block">Select Skill</label>
        <select
          value={selectedSkillId}
          onChange={(e) => setSelectedSkillId(e.target.value)}
          className="input-field max-w-xs"
        >
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-400">
          {milestones.length} milestone{milestones.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary text-sm"
        >
          + Create Milestone
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-xl p-6 mb-6 space-y-4 max-w-2xl">
          <h3 className="text-sm font-semibold text-zinc-300">
            {editId ? "Edit Milestone" : "Create Milestone"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-zinc-500 mb-1 block">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-zinc-500 mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                rows={2}
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Icon Emoji</label>
              <input
                value={form.iconEmoji}
                onChange={(e) => setForm({ ...form, iconEmoji: e.target.value })}
                className="input-field"
                placeholder="🎯"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Color</label>
              <div className="flex items-center gap-2">
                <input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="input-field w-full"
                  placeholder="#7c3aed"
                />
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Est. Minutes</label>
              <input
                type="number"
                value={form.estimatedMinutes}
                onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Lectures Required</label>
              <input
                type="number"
                min={1}
                value={form.lecturesRequired}
                onChange={(e) => setForm({ ...form, lecturesRequired: Number(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Points Reward</label>
              <input
                type="number"
                value={form.pointsReward}
                onChange={(e) => setForm({ ...form, pointsReward: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          {message && (
            <p
              className={`text-xs ${
                message.includes("created") || message.includes("updated")
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">
              {editId ? "Update Milestone" : "Create Milestone"}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading milestones...</p>
      ) : milestones.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <p className="text-zinc-500 text-sm">No milestones found for this skill.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="pb-3 pr-3">Icon</th>
                <th className="pb-3 pr-3">Title</th>
                <th className="pb-3 pr-3">Description</th>
                <th className="pb-3 pr-3">Order</th>
                <th className="pb-3 pr-3">Min</th>
                <th className="pb-3 pr-3">Req</th>
                <th className="pb-3 pr-3">Pts</th>
                <th className="pb-3 pr-3">Assigned</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-3 text-lg">{m.iconEmoji || "🎯"}</td>
                  <td className="py-3 pr-3 text-zinc-200 font-medium whitespace-nowrap">{m.title}</td>
                  <td className="py-3 pr-3 text-zinc-400 text-xs max-w-[180px] truncate">
                    {m.description || "—"}
                  </td>
                  <td className="py-3 pr-3 text-zinc-400">{m.sortOrder}</td>
                  <td className="py-3 pr-3 text-zinc-400">{m.estimatedMinutes || 0}</td>
                  <td className="py-3 pr-3 text-zinc-400">{m.lecturesRequired}</td>
                  <td className="py-3 pr-3 text-zinc-400">{m.pointsReward || 0}</td>
                  <td className="py-3 pr-3">
                    <span className="text-violet-300 text-xs">{m.lectureCount ?? 0}</span>
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[m.status] || "bg-zinc-500/20 text-zinc-400"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(m)}
                        className="text-xs text-violet-400 hover:text-violet-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
