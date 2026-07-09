import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getHomeCatalog } from "@/lib/data";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: "🤖", title: "24/7 AI Tutor", desc: "Ask anything, anytime — Groq-powered copilot per lecture" },
  { icon: "🌐", title: "Real-time Translation", desc: "Hindi, Marathi, Kannada, Tamil + 14 Indian languages" },
  { icon: "📄", title: "AI PDF Notes", desc: "Auto-generated downloadable notes with one click" },
  { icon: "🧠", title: "Smart Popups", desc: "AI analyzes topics & shows questions during video" },
  { icon: "🏆", title: "Mastery System", desc: "Practiced → Level 1 → Level 2 → Mastered with energy points" },
  { icon: "📱", title: "Offline Downloads", desc: "Download videos & watch without internet" },
  { icon: "📡", title: "Live Batch Classes", desc: "Scheduled live classes with instructor" },
  { icon: "👨‍👩‍👧", title: "Parent Dashboard", desc: "Track your child's progress & weekly reports" },
];

export default async function HomePage() {
  const user = await getSessionUser();
  const catalog = await getHomeCatalog(user);

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={user ? publicUser(user) : null} />
      <HeroBanner featured={catalog.featured} continueItem={catalog.continueLearning[0] || null} />

      <div className="-mt-16 space-y-2">
        {catalog.continueLearning.length > 0 && <ContentRow title="Continue Learning" lectures={catalog.continueLearning} />}
        {catalog.watchlist.length > 0 && <ContentRow title="My List" lectures={catalog.watchlist} />}
        {catalog.rows.map((row) => <ContentRow key={row.id} title={row.title} lectures={row.lectures} />)}
      </div>

      <section className="max-w-5xl mx-auto px-4 mt-16">
        <h2 className="text-xl font-bold text-white text-center mb-8">Why {APP_NAME} beats every Indian edtech app</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-xl p-4 text-center card-hover">
              <span className="text-2xl">{f.icon}</span>
              <p className="text-sm font-medium text-white mt-2">{f.title}</p>
              <p className="text-[10px] text-zinc-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 mt-12 text-center">
        <div className="glass rounded-2xl p-8">
          <p className="text-3xl mb-2">🇮🇳</p>
          <h3 className="text-lg font-bold text-white">Built for India</h3>
          <p className="text-sm text-zinc-400 mt-2">AI Tutor in multiple Indian languages · Hindi/Marathi/Kannada/Tamil translation · Razorpay INR payments · India-optimized CDN</p>
        </div>
      </section>

      <footer className="mt-16 border-t border-white/5 px-6 py-10 text-center text-sm text-zinc-500">
        <p className="font-semibold text-zinc-300">{APP_NAME}</p>
        <p className="mt-1">AI-powered learning · Live Classes · AI Tutor · Gamification · Translation · Offline</p>
        <div className="flex gap-4 justify-center mt-3 text-xs">
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/browse" className="hover:text-white">Browse</Link>
          <Link href="/progress" className="hover:text-white">Progress</Link>
          <Link href="/leaderboard" className="hover:text-white">Leaderboard</Link>
        </div>
      </footer>
    </main>
  );
}