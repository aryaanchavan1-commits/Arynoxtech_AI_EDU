"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";
import { TIER_CONFIG } from "@/lib/constants";

const TIERS = ["free_trial", "basic", "plus", "premium"] as const;

export default function PricingPage() {
  const { user, loading } = useSession();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleSubscribe = async (tier: string) => {
    setSubscribing(tier);
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Subscribed to ${TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.label || tier} successfully!`);
      } else {
        setMessage(data.error || "Subscription failed.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
    setSubscribing(null);
  };

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={user} />
      <div className="pt-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
          <p className="text-zinc-400 mt-2">Unlock more features as you grow</p>
        </div>

        {message && (
          <div className="text-center mb-6">
            <span className="inline-block glass rounded-xl px-6 py-3 text-sm text-green-400">{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => {
            const config = TIER_CONFIG[tier];
            const isPremium = tier === "premium";
            const isCurrent = user?.tier === tier;

            return (
              <div
                key={tier}
                className={`glass rounded-2xl p-6 flex flex-col ${isPremium ? "ring-2 ring-[var(--accent)] shadow-lg shadow-[var(--accent-glow)]" : ""}`}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">{config.label}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{config.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">
                    {config.priceInr === 0 ? "Free" : `₹${config.priceInr}`}
                  </span>
                  {config.priceInr > 0 && <span className="text-zinc-400 text-sm ml-1">/mo</span>}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {config.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier)}
                  disabled={subscribing === tier || isCurrent}
                  className={`w-full ${isCurrent ? "btn-secondary" : "btn-primary"} text-sm py-2.5`}
                >
                  {subscribing === tier ? "Processing..." : isCurrent ? "Current Plan" : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
