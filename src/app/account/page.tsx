"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";
import { TIER_CONFIG } from "@/lib/constants";

interface GamificationData {
  totalPoints: number;
  streak: number;
  level: number;
  achievementsCount: number;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(null);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!user) return;

    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setUserData(d));

    fetch("/api/gamification")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setGamification({
            totalPoints: d.totalPoints || 0,
            streak: d.streak || 0,
            level: Math.floor((d.totalPoints || 0) / 1000) + 1,
            achievementsCount: d.achievementsCount || 0,
          });
        }
      });
  }, [router, user, loading]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500">Loading...</p></div>;

  const profile = userData || user;
  const tierInfo = TIER_CONFIG[profile.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.free_trial;
  const stats = gamification || { totalPoints: profile.totalPoints || 0, streak: profile.streak || 0, level: Math.floor((profile.totalPoints || 0) / 1000) + 1, achievementsCount: 0 };

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={profile} />
      <div className="pt-24 px-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Info Card */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {profile.name?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{profile.name}</h2>
                <p className="text-sm text-zinc-400">{profile.email}</p>
                <span className="badge bg-violet-500/20 text-violet-400 mt-1 inline-block">{profile.role}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-white/5">
              <span className="text-sm text-zinc-400">Plan</span>
              <span className="text-sm text-white font-medium">{tierInfo.label}</span>
            </div>
            {profile.subscriptionExpiresAt && (
              <div className="flex items-center justify-between py-3 border-t border-white/5">
                <span className="text-sm text-zinc-400">Expires</span>
                <span className="text-sm text-zinc-300">{new Date(profile.subscriptionExpiresAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Your Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-4 text-center">
                <p className="text-2xl font-bold text-cyan-400">{stats.totalPoints.toLocaleString()}</p>
                <p className="text-xs text-zinc-500">Total Points</p>
              </div>
              <div className="rounded-lg bg-white/5 p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.level}</p>
                <p className="text-xs text-zinc-500">Level</p>
              </div>
              <div className="rounded-lg bg-white/5 p-4 text-center">
                <p className="text-2xl font-bold text-orange-400">🔥 {stats.streak}</p>
                <p className="text-xs text-zinc-500">Day Streak</p>
              </div>
              <div className="rounded-lg bg-white/5 p-4 text-center">
                <p className="text-2xl font-bold text-pink-400">{stats.achievementsCount}</p>
                <p className="text-xs text-zinc-500">Achievements</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/downloads" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition text-sm text-zinc-300 hover:text-white">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                My Downloads
              </Link>
              <Link href="/batch" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition text-sm text-zinc-300 hover:text-white">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                My Batches
              </Link>
              {profile.hasLinkedChildren && (
                <Link href="/parent" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition text-sm text-zinc-300 hover:text-white">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Parent Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Subscription Card */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Subscription</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-medium text-lg">{tierInfo.label}</p>
                <p className="text-xs text-zinc-500">{tierInfo.description}</p>
              </div>
              <span className="badge bg-violet-500/20 text-violet-400">{profile.tier}</span>
            </div>
            {profile.subscriptionExpiresAt && (
              <p className="text-xs text-zinc-500 mb-4">
                Valid until {new Date(profile.subscriptionExpiresAt).toLocaleDateString()}
              </p>
            )}
            <Link href="/pricing" className="btn-primary text-sm py-2 w-full block text-center">
              {profile.tier === "free_trial" ? "Upgrade Plan" : "Manage Plan"}
            </Link>
          </div>

          {/* Logout */}
          <div className="md:col-span-2">
            <button onClick={handleLogout} className="btn-secondary text-sm w-full text-red-400 hover:text-red-300">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
