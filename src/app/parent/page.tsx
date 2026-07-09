"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";

interface LinkedChild {
  id: string;
  childId: string;
  childName?: string;
  childEmail?: string;
  relationship: string | null;
  status?: string;
  createdAt: string;
}

interface ChildReport {
  childId: string;
  childName: string;
  lecturesCompleted: number;
  watchTimeMinutes: number;
  streak: number;
  points: number;
}

export default function ParentPage() {
  const { user, loading: sessionLoading } = useSession();
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [reports, setReports] = useState<ChildReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchLinked = () => {
    fetch("/api/parent/link")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setLinkedChildren(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const fetchReports = () => {
    setLoadingReports(true);
    fetch("/api/parent/report")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLoadingReports(false);
      })
      .catch(() => setLoadingReports(false));
  };

  useEffect(() => {
    if (!sessionLoading && !user) return;
    fetchLinked();
    fetchReports();
  }, [user, sessionLoading]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinking(true);
    setLinkMessage("");
    try {
      const res = await fetch("/api/parent/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, relationship }),
      });
      const data = await res.json();
      if (res.ok) {
        setLinkMessage("Child linked successfully!");
        setEmail("");
        fetchLinked();
        fetchReports();
      } else {
        setLinkMessage(data.error || "Failed to link child.");
      }
    } catch {
      setLinkMessage("Something went wrong.");
    }
    setLinking(false);
  };

  if (sessionLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={user} />
      <div className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">Parent Dashboard</h1>
          <p className="text-zinc-400 mt-1">Monitor your child's learning progress</p>
        </div>

        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Link a Child</h2>
          <form onSubmit={handleLink} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Child's email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field flex-1"
            />
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="input-field w-full sm:w-40"
            >
              <option value="parent">Parent</option>
              <option value="guardian">Guardian</option>
              <option value="mentor">Mentor</option>
            </select>
            <button type="submit" disabled={linking} className="btn-primary text-sm whitespace-nowrap">
              {linking ? "Linking..." : "Link"}
            </button>
          </form>
          {linkMessage && <p className="text-sm text-green-400 mt-3">{linkMessage}</p>}
        </div>

        {linkedChildren.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Linked Children</h2>
            <div className="space-y-2">
              {linkedChildren.map((lc) => (
                <div key={lc.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                  <div>
                    <p className="text-sm text-white font-medium">{lc.childName || lc.childEmail || lc.childId}</p>
                    <p className="text-xs text-zinc-500">{lc.relationship} · Linked {new Date(lc.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="badge bg-green-500/20 text-green-400">Active</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Children Reports</h2>
          {loadingReports ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 loading-shimmer rounded-xl" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <p className="text-zinc-500 text-sm">No reports yet. Link a child to see their progress.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((r) => (
                <div key={r.childId} className="rounded-xl bg-white/5 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white">
                      {r.childName?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-white font-medium">{r.childName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="glass rounded-lg p-3">
                      <p className="text-lg font-bold text-violet-400">{r.lecturesCompleted}</p>
                      <p className="text-xs text-zinc-500">Lectures</p>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <p className="text-lg font-bold text-cyan-400">{r.watchTimeMinutes}m</p>
                      <p className="text-xs text-zinc-500">Watch Time</p>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <p className="text-lg font-bold text-orange-400">🔥 {r.streak}</p>
                      <p className="text-xs text-zinc-500">Streak</p>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <p className="text-lg font-bold text-pink-400">{r.points}</p>
                      <p className="text-xs text-zinc-500">Points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
