import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getHomeCatalog } from "@/lib/data";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

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

      <footer className="mt-16 border-t border-white/5 px-6 py-10 text-center text-sm text-zinc-500">
        <p className="font-semibold text-zinc-300">{APP_NAME}</p>
        <p className="mt-1">AI-powered learning · Live Classes · AI Tutor · Gamification</p>
        <div className="flex gap-4 justify-center mt-3 text-xs">
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/browse" className="hover:text-white">Browse</Link>
          <Link href="/search" className="hover:text-white">Search</Link>
        </div>
      </footer>
    </main>
  );
}