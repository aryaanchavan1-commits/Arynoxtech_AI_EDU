"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { VideoPlayer } from "@/components/VideoPlayer";
import { FlashcardDeck, QuizPanel, AiTutorDrawer } from "@/components/AiTutorDrawer";
import { useSession } from "@/lib/client-session";

const LEVEL_BADGES: Record<string, string> = { practiced: "🌱", level_1: "🔥", level_2: "⭐", mastered: "🏆" };
const LEVEL_LABELS: Record<string, string> = { practiced: "Practiced", level_1: "Level 1", level_2: "Level 2", mastered: "Mastered" };

export default function WatchPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "flashcards" | "quiz" | "transcript">("notes");
  const [quizResults, setQuizResults] = useState<any>(null);
  const [mastery, setMastery] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { user } = useSession();

  useEffect(() => {
    fetch(`/api/watch?id=${params.id}`).then((r) => r.json()).then(setData);
    fetch(`/api/quiz-attempt?lectureId=${params.id}`).then(r => r.json()).then(d => {
      setQuizResults(d);
      if (d.allCorrect) setCompleted(true);
    });
    fetch(`/api/transcript?lectureId=${params.id}`).then(r => r.json()).then(d => {
      if (d.transcript) setTranscript(d.transcript);
    });
  }, [params.id]);

  useEffect(() => {
    if (data?.lecture?.skillId) {
      fetch(`/api/mastery?skillId=${data.lecture.skillId}`).then(r => r.json()).then(d => {
        if (d.skills?.[0]) setMastery(d.skills[0]);
      });
    }
  }, [data]);

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

  const handleComplete = async () => {
    await fetch("/api/mastery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId: params.id }),
    });
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId: params.id, completed: true, positionSeconds: 0, durationSeconds: 0 }),
    });
    setCompleted(true);
  };

  const handleGenerateTranscript = async () => {
    const res = await fetch("/api/transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId: params.id }),
    });
    const d = await res.json();
    if (d.transcript) setTranscript(d.transcript);
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500 animate-pulse">Loading...</p></div>;

  const { lecture, skill, module: mod, flashcards, quizzes, related } = data;
  const allQuizAttempts = quizResults?.attempts || [];
  const hasQuizzes = quizzes && quizzes.length > 0;
  const canComplete = !hasQuizzes || (hasQuizzes && quizResults?.allCorrect);

  return (
    <main className="min-h-screen pb-20">
      <Navbar user={user} />
      <div className="pt-16 max-w-6xl mx-auto px-4">
        <div className="mt-4">
          <VideoPlayer src={lecture.mp4Url || lecture.hlsUrl} poster={lecture.thumbnailUrl} />
        </div>

        <div className="mt-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{lecture.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-zinc-400">
              {mod && <span>{mod.title}</span>}
              <span>{Math.floor((lecture.durationSeconds || 0) / 60)} min</span>
              <span className={`badge ${lecture.tierRequired === "free_trial" ? "bg-green-500/20 text-green-300" : "bg-violet-500/20 text-violet-300"}`}>{lecture.tierRequired}</span>
              {completed && <span className="badge bg-green-500/20 text-green-300">✅ Completed</span>}
            </div>
            <p className="text-sm text-zinc-400 mt-3">{lecture.description}</p>
          </div>
          {mastery && (
            <div className="glass rounded-xl px-3 py-2 text-center min-w-[100px]">
              <span className="text-xl">{LEVEL_BADGES[mastery.level] || "🌱"}</span>
              <p className="text-xs font-medium text-zinc-300 mt-0.5">{LEVEL_LABELS[mastery.level] || "Practiced"}</p>
              <p className="text-[10px] text-zinc-500">{mastery.energyPoints || 0} EP</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4 border-b border-white/10">
          {["notes", "flashcards", "quiz", "transcript"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-sm px-4 py-2 border-b-2 transition ${activeTab === tab ? "border-violet-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
            >
              {tab === "transcript" ? "Transcript" : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
          {activeTab === "quiz" && (
            <div>
              <QuizPanel quizzes={quizzes || []} />
              {allQuizAttempts.length > 0 && (
                <div className="mt-3 text-xs text-zinc-400">
                  You've attempted {allQuizAttempts.length}/{quizzes?.length || 0} questions.
                  {quizResults?.allCorrect ? (
                    <span className="text-green-400 ml-1">All correct! ✅</span>
                  ) : (
                    <span className="text-yellow-400 ml-1">Not all correct yet.</span>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === "transcript" && (
            <div>
              {transcript ? (
                <div className="glass rounded-xl p-6 text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">{transcript}</div>
              ) : (
                <button onClick={handleGenerateTranscript} className="btn-secondary text-sm">
                  Generate AI Transcript
                </button>
              )}
            </div>
          )}
        </div>

        {!completed && (
          <div className="mt-6 flex items-center gap-3 glass rounded-xl p-4">
            {hasQuizzes && !quizResults?.allCorrect && (
              <p className="text-xs text-yellow-400 flex-1">⚠️ Complete the quiz with all correct answers to mark this lecture done</p>
            )}
            <button
              onClick={handleComplete}
              disabled={!canComplete}
              className={`text-sm px-6 py-2 rounded-lg font-semibold transition ${
                canComplete
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              Mark Complete
            </button>
          </div>
        )}

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