"use client";

import { useState } from "react";
import { X, Copy, Check } from "lucide-react";

const EMOJI_REACTIONS = ["🔥", "💜", "🚀", "🎯", "💡", "⭐"];

export function FlashcardDeck({ flashcards }: { flashcards: { id: string; question: string; answer: string; difficulty: number }[] }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!flashcards.length) return null;
  const card = flashcards[current];

  return (
    <div className="glass rounded-xl p-6 my-4">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Flashcards</h3>
      <div
        className="relative min-h-[140px] rounded-xl bg-zinc-900/60 p-5 cursor-pointer flex items-center justify-center text-center"
        onClick={() => setFlipped(!flipped)}
      >
        <div className="transition-opacity duration-200">
          {flipped ? (
            <p className="text-zinc-300">{card.answer}</p>
          ) : (
            <p className="text-white font-medium">{card.question}</p>
          )}
          <p className="text-[10px] text-zinc-600 mt-3">{flipped ? "Tap to see question" : "Tap to reveal answer"}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => { setCurrent((c) => Math.max(0, c - 1)); setFlipped(false); }} disabled={current === 0} className="btn-secondary text-xs py-1 px-3 disabled:opacity-30">Prev</button>
        <span className="text-xs text-zinc-500 self-center">{current + 1} / {flashcards.length}</span>
        <button onClick={() => { setCurrent((c) => Math.min(flashcards.length - 1, c + 1)); setFlipped(false); }} disabled={current >= flashcards.length - 1} className="btn-secondary text-xs py-1 px-3 disabled:opacity-30">Next</button>
      </div>
    </div>
  );
}

export function QuizPanel({ quizzes }: { quizzes: { id: string; question: string; options: string[]; correctIndex: number; explanation: string }[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!quizzes.length) return null;

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="glass rounded-xl p-6 my-4">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Quiz</h3>
      {quizzes.map((quiz, qi) => (
        <div key={quiz.id} className="mb-6 last:mb-0">
          <p className="text-sm text-white font-medium mb-2">Q{qi + 1}. {quiz.question}</p>
          <div className="space-y-1.5">
            {quiz.options.map((opt, oi) => {
              const isSelected = answers[quiz.id] === oi;
              const isCorrect = submitted && oi === quiz.correctIndex;
              const isWrong = submitted && isSelected && oi !== quiz.correctIndex;
              return (
                <button
                  key={oi}
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [quiz.id]: oi })}
                  className={`w-full text-left text-sm rounded-lg px-3 py-2 transition ${
                    isCorrect ? "bg-green-500/20 border border-green-500/30 text-green-300" :
                    isWrong ? "bg-red-500/20 border border-red-500/30 text-red-300" :
                    isSelected ? "bg-violet-500/20 border border-violet-500/30 text-violet-300" :
                    "bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {submitted && <p className="text-xs text-zinc-500 mt-2">{quiz.explanation}</p>}
        </div>
      ))}
      {!submitted && (
        <button onClick={handleSubmit} className="btn-primary text-sm w-full mt-2">Check Answers</button>
      )}
      {submitted && (
        <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="btn-secondary text-sm w-full mt-2">Retry</button>
      )}
    </div>
  );
}

export function AiTutorDrawer({ open, onClose, lectureId, lectureTitle }: { open: boolean; onClose: () => void; lectureId?: string; lectureTitle?: string }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg, lectureId, lectureTitle }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.content || data.error || "No response" }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-semibold text-white">AI Tutor</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`text-sm rounded-xl px-4 py-2 max-w-[85%] ${m.role === "user" ? "bg-violet-600/30 ml-auto" : "bg-zinc-800/50"}`}>
              <p className="text-zinc-300">{m.content}</p>
            </div>
          ))}
          {loading && <div className="text-zinc-500 text-sm animate-pulse">Thinking...</div>}
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything about this lecture..."
              className="input-field text-sm flex-1"
            />
            <button onClick={sendMessage} disabled={loading} className="btn-primary text-sm py-2 px-4">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}