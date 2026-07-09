"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";

export default function SearchPage() {
  const { user } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/sync/pull?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.documents?.lectures || []);
    setSearching(false);
  };

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={user} />
      <div className="pt-20 px-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-white mb-4">Search</h1>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search lectures, skills, topics..."
            className="input-field"
          />
          <button onClick={handleSearch} disabled={searching} className="btn-primary text-sm whitespace-nowrap">{searching ? "..." : "Search"}</button>
        </div>

        <div className="mt-6 space-y-2">
          {results.map((r: any) => (
            <a key={r.id} href={`/watch/${r.id}`} className="block glass rounded-lg p-4 hover:bg-white/5 transition">
              <p className="text-sm text-white font-medium">{r.title}</p>
              <p className="text-xs text-zinc-500 mt-1">{r.description?.slice(0, 100)}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}