"use client";

import { useState } from "react";

const TIERS = ["free_trial", "basic", "plus", "premium"] as const;

const TIER_COLORS: Record<string, string> = {
  free_trial: "text-zinc-400 bg-zinc-500/20",
  basic: "text-cyan-300 bg-cyan-500/20",
  plus: "text-purple-300 bg-purple-500/20",
  premium: "text-violet-300 bg-violet-500/20",
};

export function AdminUsersTable({ users: initial }: { users: any[] }) {
  const [userList, setUserList] = useState(initial);

  const toggleBlock = async (userId: string, blocked: boolean) => {
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: blocked ? "unblock" : "block" }),
    });
    if (res.ok) {
      setUserList((prev) => prev.map((u: any) => u.id === userId ? { ...u, isBlocked: !blocked } : u));
    }
  };

  const setTier = async (userId: string, tier: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "setTier", tier }),
    });
    if (res.ok) {
      const endsAt = tier === "free_trial" ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      setUserList((prev) => prev.map((u: any) => u.id === userId ? { ...u, tier, subscriptionExpiresAt: endsAt } : u));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider border-b border-white/5">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Tier</th>
            <th className="pb-3 pr-4">Expires</th>
            <th className="pb-3 pr-4">Role</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Points</th>
            <th className="pb-3 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {userList.map((user: any) => (
            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-3 pr-4 text-zinc-300">{user.name}</td>
              <td className="py-3 pr-4 text-zinc-400 text-xs">{user.email}</td>
              <td className="py-3 pr-4">
                {user.role === "admin" ? (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">admin</span>
                ) : (
                  <select
                    value={user.tier}
                    onChange={(e) => setTier(user.id, e.target.value)}
                    className="text-xs bg-transparent border border-white/10 rounded-lg px-2 py-1 text-zinc-300 cursor-pointer"
                  >
                    {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
              </td>
              <td className="py-3 pr-4 text-[10px] text-zinc-500">
                {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : "—"}
              </td>
              <td className="py-3 pr-4 text-zinc-400">{user.role}</td>
              <td className="py-3 pr-4">
                <span className={`text-xs ${user.isBlocked ? "text-red-400" : "text-green-400"}`}>
                  {user.isBlocked ? "Blocked" : "Active"}
                </span>
              </td>
              <td className="py-3 pr-4 text-zinc-400">{user.totalPoints || 0}</td>
              <td className="py-3">
                {user.role !== "admin" && (
                  <button
                    onClick={() => toggleBlock(user.id, user.isBlocked)}
                    className={`text-xs px-3 py-1 rounded-lg ${user.isBlocked ? "bg-green-500/20 text-green-300 hover:bg-green-500/30" : "bg-red-500/20 text-red-300 hover:bg-red-500/30"}`}
                  >
                    {user.isBlocked ? "Unblock" : "Block"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}