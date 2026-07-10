"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";
import jsPDF from "jspdf";

const VideoPlayer = dynamic(() => import("@/components/VideoPlayer").then((m) => m.VideoPlayer), { ssr: false });
const AiTutorDrawer = dynamic(() => import("@/components/AiTutorDrawer").then((m) => m.AiTutorDrawer), { ssr: false });
const FlashcardDeck = dynamic(() => import("@/components/AiTutorDrawer").then((m) => m.FlashcardDeck), { ssr: false });
const QuizPanel = dynamic(() => import("@/components/AiTutorDrawer").then((m) => m.QuizPanel), { ssr: false });

const LEVEL_BADGES: Record<string, string> = { practiced: "🌱", level_1: "🔥", level_2: "⭐", mastered: "🏆" };
const LEVEL_LABELS: Record<string, string> = { practiced: "Practiced", level_1: "Level 1", level_2: "Level 2", mastered: "Mastered" };
const LANG_NAMES: Record<string, string> = {
  hi: "हिन्दी", en: "English", mr: "मराठी", kn: "ಕನ್ನಡ", ta: "தமிழ்",
  te: "తెలుగు", ml: "മലയാളം", gu: "ગુજરાતી", bn: "বাংলা", pa: "ਪੰਜਾਬੀ",
  ur: "اردو", or: "ଓଡ଼ିଆ", as: "অসমীয়া",
};

export default function WatchPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "flashcards" | "quiz" | "transcript" | "translate">("notes");
  const [quizResults, setQuizResults] = useState<any>(null);
  const [mastery, setMastery] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState("hi");
  const [translating, setTranslating] = useState(false);
  const [smartPopups, setSmartPopups] = useState<any[]>([]);
  const [currentPopup, setCurrentPopup] = useState<any>(null);
  const [popupAnswer, setPopupAnswer] = useState<number | null>(null);
  const [popupSubmitted, setPopupSubmitted] = useState(false);
  const [pdfNotes, setPdfNotes] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [personalNote, setPersonalNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
  const { user } = useSession();
  const popupTimerRef = useRef<any>(null);

  useEffect(() => {
    fetch(`/api/watch?id=${params.id}`).then((r) => r.json()).then(setData);
    fetch(`/api/quiz-attempt?lectureId=${params.id}`).then(r => r.json()).then(d => {
      setQuizResults(d);
      if (d.allCorrect) setCompleted(true);
    });
    fetch(`/api/transcript?lectureId=${params.id}`).then(r => r.json()).then(d => {
      if (d.transcript) setTranscript(d.transcript);
    });
    fetch(`/api/smart-popup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId: params.id }),
    }).then(r => r.json()).then(d => setSmartPopups(d.popups || []));
    // Load personal notes
    fetch(`/api/notes?lectureId=${params.id}`).then(r => r.json()).then(d => {
      if (d.notes?.[0]) setPersonalNote(d.notes[0].content || "");
    });
  }, [params.id]);

  useEffect(() => {
    if (data?.lecture?.skillId) {
      fetch(`/api/mastery?skillId=${data.lecture.skillId}`).then(r => r.json()).then(d => {
        if (d.skills?.[0]) setMastery(d.skills[0]);
      });
    }
  }, [data]);

  // Auto-show smart popups based on video time (simplified — show on load for demo)
  useEffect(() => {
    if (smartPopups.length > 0 && !currentPopup) {
      const idx = 0;
      setCurrentPopup(smartPopups[idx]);
    }
  }, [smartPopups]);

  const handleTranslate = async () => {
    if (!transcript) return;
    setTranslating(true);
    const res = await fetch("/api/translate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: transcript, targetLang }),
    });
    const d = await res.json();
    if (d.translated) setTranslatedText(d.translated);
    setTranslating(false);
  };

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

  const downloadPdf = async () => {
    if (!pdfNotes) return;
    const doc = new jsPDF();
    const lines = pdfNotes.split("\n");
    let y = 20;
    doc.setFontSize(16);
    doc.setTextColor(124, 58, 237);
    doc.text(data?.lecture?.title || "Study Notes", 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    for (const line of lines) {
      if (y > 270) { doc.addPage(); y = 20; }
      if (line.startsWith("## ")) {
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text(line.replace("## ", ""), 20, y);
        y += 7;
      } else if (line.startsWith("- **")) {
        const parts = line.replace("- **", "").split("**: ");
        doc.setFontSize(10);
        doc.setTextColor(124, 58, 237);
        doc.text(parts[0] || "", 25, y);
        if (parts[1]) {
          doc.setTextColor(200, 200, 200);
          doc.text(parts[1], 25 + doc.getTextWidth(parts[0] + " "), y);
        }
        y += 6;
      } else if (line.trim()) {
        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        const split = doc.splitTextToSize(line, 170);
        split.forEach((s: string) => {
          if (y > 50) { doc.addPage(); y = 20; }
          doc.text(s, 20, y);
          y += 5;
        });
      } else { y += 3; }
    }
    doc.save(`${data?.lecture?.title || "notes"}.pdf`);
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    const res = await fetch("/api/notes/download", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId: params.id }),
    });
    const d = await res.json();
    if (d.notes) {
      setPdfNotes(d.notes);
      setTimeout(() => downloadPdf(), 500);
    }
    setGeneratingPdf(false);
  };

  const savePersonalNote = async () => {
    setSavingNote(true);
    await fetch("/api/notes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId: params.id, content: personalNote }),
    });
    setSavingNote(false);
  };

  const closePopup = () => {
    setCurrentPopup(null);
    setPopupAnswer(null);
    setPopupSubmitted(false);
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
        <div className="mt-4 relative">
          <VideoPlayer src={lecture.mp4Url || lecture.hlsUrl} poster={lecture.thumbnailUrl} />
          {/* Smart Popup Overlay */}
          {currentPopup && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
              <div className="glass-strong rounded-2xl p-6 max-w-md w-full mx-4 animate-fade-up">
                {currentPopup.type === "question" ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">❓</span>
                      <span className="text-xs text-violet-400 uppercase tracking-wider">Quick Question</span>
                    </div>
                    <p className="text-sm text-white font-medium mb-4">{currentPopup.question}</p>
                    <div className="space-y-2">
                      {(currentPopup.options || []).map((opt: string, i: number) => {
                        const isSelected = popupAnswer === i;
                        const showCorrect = popupSubmitted && i === currentPopup.correctIndex;
                        const showWrong = popupSubmitted && isSelected && i !== currentPopup.correctIndex;
                        return (
                          <button
                            key={i}
                            onClick={() => !popupSubmitted && setPopupAnswer(i)}
                            className={`w-full text-left text-sm rounded-lg px-3 py-2.5 transition ${
                              showCorrect ? "bg-green-500/20 border border-green-500/30 text-green-300" :
                              showWrong ? "bg-red-500/20 border border-red-500/30 text-red-300" :
                              isSelected ? "bg-violet-500/20 border border-violet-500/30 text-violet-300" :
                              "bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {popupSubmitted && (
                      <p className="text-xs text-zinc-400 mt-3">{currentPopup.explanation}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      {!popupSubmitted && (
                        <button onClick={() => { setPopupSubmitted(true); }} disabled={popupAnswer === null} className="btn-primary text-xs flex-1">
                          Submit
                        </button>
                      )}
                      <button onClick={closePopup} className="btn-secondary text-xs flex-1">Continue</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{currentPopup.emoji || "💡"}</span>
                      <span className="text-xs text-cyan-400 uppercase tracking-wider">{currentPopup.title || "Smart Insight"}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{currentPopup.message}</p>
                    <button onClick={closePopup} className="btn-secondary text-xs mt-4 w-full">Got it!</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{lecture.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-zinc-400 flex-wrap">
              {mod && <span>{mod.title}</span>}
              <span>{Math.floor((lecture.durationSeconds || 0) / 60)} min</span>
              <span className={`badge ${lecture.tierRequired === "free_trial" ? "bg-green-500/20 text-green-300" : "bg-violet-500/20 text-violet-300"}`}>{lecture.tierRequired}</span>
              {completed && <span className="badge bg-green-500/20 text-green-300">✅ Completed</span>}
            </div>
            <p className="text-sm text-zinc-400 mt-3">{lecture.description}</p>
          </div>
          {mastery && (
            <div className="glass rounded-xl px-3 py-2 text-center min-w-[100px] ml-4">
              <span className="text-xl">{LEVEL_BADGES[mastery.level] || "🌱"}</span>
              <p className="text-xs font-medium text-zinc-300 mt-0.5">{LEVEL_LABELS[mastery.level] || "Practiced"}</p>
              <p className="text-[10px] text-zinc-500">{mastery.energyPoints || 0} EP</p>
            </div>
          )}
        </div>

        <div className="flex gap-1 mt-4 border-b border-white/10 overflow-x-auto">
          {["notes", "flashcards", "quiz", "transcript", "translate"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-sm px-3 py-2 border-b-2 transition whitespace-nowrap ${
                activeTab === tab ? "border-violet-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "translate" ? "🌐 Translate" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeTab === "notes" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">AI Generated Notes</h3>
                  {pdfNotes && <button onClick={downloadPdf} className="btn-secondary text-xs py-1 px-3">📥 Download PDF</button>}
                </div>
                {aiNotes ? (
                  <div className="glass rounded-xl p-6 prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-zinc-300">{aiNotes}</div>
                ) : (
                  <button onClick={loadAiNotes} disabled={loadingNotes} className="btn-primary text-sm">
                    {loadingNotes ? "Generating..." : "Generate AI Notes"}
                  </button>
                )}
              </div>
              <div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">📄 Downloadable PDF Notes</h3>
                  <button onClick={handleGeneratePdf} disabled={generatingPdf} className="btn-secondary text-sm">
                    {generatingPdf ? "Generating..." : "Generate & Download PDF Notes"}
                  </button>
                </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">✏️ My Personal Notes</h3>
                <textarea
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  className="input-field text-sm min-h-[120px]"
                  placeholder="Write your own notes here..."
                />
                <button onClick={savePersonalNote} disabled={savingNote} className="btn-secondary text-xs mt-2">
                  {savingNote ? "Saving..." : "💾 Save Notes"}
                </button>
              </div>
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
          {activeTab === "translate" && (
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Translate</h3>
                <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="input-field text-xs max-w-[160px]">
                  {Object.entries(LANG_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name} ({code})</option>
                  ))}
                </select>
                <button onClick={handleTranslate} disabled={translating || !transcript} className="btn-secondary text-xs">
                  {translating ? "Translating..." : "Translate"}
                </button>
              </div>
              {translatedText && (
                <div className="text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                  <p className="text-xs text-cyan-400 mb-2">Translated to {LANG_NAMES[targetLang] || targetLang}</p>
                  {translatedText}
                </div>
              )}
              {!transcript && <p className="text-zinc-500 text-xs">Generate the transcript first, then translate.</p>}
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
          title="AI Copilot (24/7)"
        >
          🤖
        </button>

        <AiTutorDrawer open={aiOpen} onClose={() => setAiOpen(false)} lectureId={params.id as string} lectureTitle={lecture?.title} />

        {related?.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-white mb-4">Related Lectures</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((r: any) => (
                <a key={r.id} href={`/watch/${r.id}`} className="card-hover">
                <div className="rounded-lg overflow-hidden bg-zinc-900 aspect-video">
                  <img src={r.thumbnailUrl} alt={r.title} className="w-full h-full object-cover" loading="lazy" />
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