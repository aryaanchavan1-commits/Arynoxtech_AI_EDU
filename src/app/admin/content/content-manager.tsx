"use client";

import { useState } from "react";

export function ContentManager({ data }: { data: { skills: any[]; modules: any[]; lectures: any[] } }) {
  const [activeTab, setActiveTab] = useState<"skills" | "modules" | "lectures">("skills");
  const [items, setItems] = useState(data.skills);

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Delete this item?")) return;
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    setItems((prev) => prev.filter((i: any) => i.id !== id));
  };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {["skills", "modules", "lectures"].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as any); setItems(data[tab as keyof typeof data] || []); }}
            className={`text-sm px-4 py-2 rounded-lg transition ${activeTab === tab ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "text-zinc-400 hover:text-white"}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({data[tab as keyof typeof data]?.length || 0})
          </button>
        ))}
      </div>

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