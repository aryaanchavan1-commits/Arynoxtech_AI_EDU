"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { VideoPlayer } from "@/components/VideoPlayer";
import { FlashcardDeck, QuizPanel, AiTutorDrawer } from "@/components/AiTutorDrawer";
import { useSession } from "@/lib/client-session";

export default function WatchPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "flashcards" | "quiz">("notes");
  const { user } = useSession();

  useEffect(() => {
    fetch(`/api/watch?id=${params.id}`).then((r) => r.json()).then(setData);
  }, [params.id]);

  const loadAiNotes = useCallback(async () => {
    setLoadingNotes(true);
    const res = await fetch("/api/ai/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId: params.id }),
    });
    const d = await res.json();
    setAiNotes(d.content || d.error || "Notes unavailable");
    setLoadingNotes(false);
  }, [params.id]);

  if (!data) return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500 animate-pulse">Loading...</p></div>;

  const { lecture, skill, module: mod, flashcards, quizzes, related } = data;

  return (
    <main className="min-h-screen pb-20">
      <Navbar user={user} />
      <div className="pt-16 max-w-6xl mx-auto px-4">
        <div className="mt-4">
          <VideoPlayer src={lecture.mp4Url || lecture.hlsUrl} poster={lecture.thumbnailUrl} />
        </div>

        <div className="mt-6">
          <h1 className="text-2xl font-bold text-white">{lecture.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-zinc-400">
            {mod && <span>{mod.title}</span>}
            <span>{Math.floor((lecture.durationSeconds || 0) / 60)} min</span>
            <span className={`badge ${lecture.tierRequired === "free_trial" ? "bg-green-500/20 text-green-300" : "bg-violet-500/20 text-violet-300"}`}>{lecture.tierRequired}</span>
          </div>
          <p className="text-sm text-zinc-400 mt-3">{lecture.description}</p>
        </div>

        <div className="flex gap-2 mt-4 border-b border-white/10">
          {["notes", "flashcards", "quiz"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-sm px-4 py-2 border-b-2 transition ${activeTab === tab ? "border-violet-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeTab === "notes" && (
            <div>
              {aiNotes ? (
                <div className="glass rounded-xl p-6 prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-zinc-300">{aiNotes}</div>
              ) : (
                <button onClick={loadAiNotes} disabled={loadingNotes} className="btn-primary text-sm">
                  {loadingNotes ? "Generating..." : "Generate AI Notes"}
                </button>
              )}
            </div>
          )}
          {activeTab === "flashcards" && <FlashcardDeck flashcards={flashcards || []} />}
          {activeTab === "quiz" && <QuizPanel quizzes={data.quizzes || []} />}
        </div>

        <button
          onClick={() => setAiOpen(true)}
          className="fixed bottom-6 right-6 z-40 btn-primary rounded-full w-14 h-14 shadow-2xl pulse-glow"
        >
          🤖
        </button>

        <AiTutorDrawer open={aiOpen} onClose={() => setAiOpen(false)} />

        {related?.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-white mb-4">Related Lectures</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((r: any) => (
                <a key={r.id} href={`/watch/${r.id}`} className="card-hover">
                <div className="rounded-lg overflow-hidden bg-zinc-900 aspect-video">
                  <img src={r.thumbnailUrl} alt={r.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-zinc-300 mt-1.5 truncate">{r.title}</p>
              </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}