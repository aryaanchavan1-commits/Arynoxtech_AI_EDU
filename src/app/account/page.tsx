"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";
import { TIER_CONFIG } from "@/lib/constants";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setStats(d));
  }, [router, user, loading]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    router.push("/");
    router.refresh();
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500">Loading...</p></div>;

  const tierInfo = TIER_CONFIG[user.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.free_trial;

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={user} />
      <div className="pt-20 px-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold">{user.name?.charAt(0)}</div>
          <div>
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            <p className="text-sm text-zinc-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{stats?.progressCount || 0}</p>
            <p className="text-xs text-zinc-500">Lectures</p>
          </div>
          <div className="glass rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{user.totalPoints || 0}</p>
            <p className="text-xs text-zinc-500">Points</p>
          </div>
          <div className="glass rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-pink-400">🔥 {user.streak || 0}</p>
            <p className="text-xs text-zinc-500">Day Streak</p>
          </div>
        </div>

        <div className="glass rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{tierInfo.label}</p>
              <p className="text-xs text-zinc-500">{tierInfo.description}</p>
            </div>
            <a href="/pricing" className="btn-primary text-xs py-1.5 px-3">{user.tier === "free_trial" ? "Upgrade" : "Manage"}</a>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-secondary text-sm w-full">Sign Out</button>
      </div>
    </main>
  );
}