"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";

export default function MyListPage() {
  const [items, setItems] = useState<any[]>([]);

  const { user } = useSession();

  useEffect(() => {
    fetch("/api/watchlist").then((r) => r.json()).then((d) => setItems(d.items || []));
  }, []);

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={user} />
      <div className="pt-20 px-6">
        <h1 className="text-2xl font-bold text-white">My List</h1>
        {!user && <p className="text-zinc-500 mt-4">Sign in to save your favorites.</p>}
        {user && items.length === 0 && <p className="text-zinc-500 mt-4">Nothing added yet. Browse and add lectures to your list!</p>}
      </div>
    </main>
  );
}