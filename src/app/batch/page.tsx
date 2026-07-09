"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";

interface BatchClass {
  id: string;
  title: string;
  description: string | null;
  instructorName?: string;
  skillId: string | null;
  skillTitle?: string;
  maxStudents: number;
  price: number;
  startDate: string | null;
  endDate: string | null;
  scheduleJson: string | null;
  status: string;
  enrolledCount?: number;
  isEnrolled?: boolean;
}

export default function BatchPage() {
  const { user, loading: sessionLoading } = useSession();
  const [batches, setBatches] = useState<BatchClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchBatches = () => {
    setLoading(true);
    fetch("/api/batch")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch batches");
        return r.json();
      })
      .then((data) => {
        setBatches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!sessionLoading && !user) return;
    fetchBatches();
  }, [user, sessionLoading]);

  const handleEnroll = async (batchId: string) => {
    setEnrolling(batchId);
    setMessage("");
    try {
      const res = await fetch("/api/batch/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Enrolled successfully!");
        fetchBatches();
      } else {
        setMessage(data.error || "Enrollment failed.");
      }
    } catch {
      setMessage("Something went wrong.");
    }
    setEnrolling(null);
  };

  const parseSchedule = (json: string | null) => {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return json;
    }
  };

  const skills = [...new Set(batches.map((b) => b.skillTitle).filter(Boolean))] as string[];
  const filtered = filterSkill ? batches.filter((b) => b.skillTitle === filterSkill) : batches;

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
      <div className="pt-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">Live Classes</h1>
          <p className="text-zinc-400 mt-1">Join batch classes and learn live with instructors</p>
        </div>

        {message && (
          <div className="text-center mb-6">
            <span className="inline-block glass rounded-xl px-6 py-3 text-sm text-green-400">{message}</span>
          </div>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              onClick={() => setFilterSkill("")}
              className={`text-xs px-4 py-1.5 rounded-full transition ${!filterSkill ? "bg-violet-600 text-white" : "glass text-zinc-300 hover:text-white"}`}
            >
              All
            </button>
            {skills.map((s) => (
              <button
                key={s}
                onClick={() => setFilterSkill(s)}
                className={`text-xs px-4 py-1.5 rounded-full transition ${filterSkill === s ? "bg-violet-600 text-white" : "glass text-zinc-300 hover:text-white"}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 space-y-3">
                <div className="h-5 loading-shimmer rounded w-3/4" />
                <div className="h-4 loading-shimmer rounded w-full" />
                <div className="h-3 loading-shimmer rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-8 text-center text-zinc-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-zinc-400">No batches available{filterSkill ? ` for ${filterSkill}` : ""}. Check back later!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((b) => {
              const schedule = parseSchedule(b.scheduleJson);
              const seatsLeft = b.maxStudents - (b.enrolledCount ?? 0);
              return (
                <div key={b.id} className={`glass rounded-xl p-6 flex flex-col ${b.isEnrolled ? "ring-1 ring-green-500/40" : ""}`}>
                  <div className="mb-3">
                    <h3 className="text-white font-semibold">{b.title}</h3>
                    {b.skillTitle && <span className="badge bg-violet-500/20 text-violet-400 text-xs mt-1 inline-block">{b.skillTitle}</span>}
                  </div>

                  {b.description && <p className="text-sm text-zinc-400 mb-3 flex-1">{b.description}</p>}

                  <div className="text-xs text-zinc-500 space-y-1.5 mb-4">
                    {b.instructorName && (
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {b.instructorName}
                      </div>
                    )}
                    {schedule && typeof schedule === "object" && (
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {Array.isArray(schedule) ? schedule.map((s: any) => s.day || s).join(", ") : JSON.stringify(schedule)}
                      </div>
                    )}
                    {b.price > 0 ? (
                      <div className="flex items-center gap-2 text-cyan-400 font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ₹{b.price}
                      </div>
                    ) : (
                      <span className="text-green-400">Free</span>
                    )}
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}
                    </div>
                  </div>

                  {b.isEnrolled ? (
                    <span className="text-xs text-green-400 font-medium text-center py-2">✓ Enrolled</span>
                  ) : (
                    <button
                      onClick={() => handleEnroll(b.id)}
                      disabled={enrolling === b.id || seatsLeft <= 0}
                      className="btn-primary text-xs py-2 w-full"
                    >
                      {enrolling === b.id ? "Enrolling..." : seatsLeft <= 0 ? "Full" : "Enroll"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
