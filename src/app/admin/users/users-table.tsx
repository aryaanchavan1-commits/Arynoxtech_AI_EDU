"use client";

import { useState } from "react";

export function AdminUsersTable({ users }: { users: any[] }) {
  const [userList, setUserList] = useState(users);

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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider border-b border-white/5">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Tier</th>
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
                <span className={`badge text-[10px] ${user.tier === "premium" ? "text-violet-300 bg-violet-500/20" : user.tier === "free_trial" ? "text-zinc-400 bg-zinc-500/20" : "text-cyan-300 bg-cyan-500/20"}`}>{user.tier}</span>
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