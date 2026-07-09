"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { APP_NAME } from "@/lib/constants";
import type { User } from "@/db/schema";

export function Navbar({ user }: { user: Partial<User> | null }) {
  const [appName, setAppName] = useState("Arynox-EDU");
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((s) => {
      if (s.appName) setAppName(s.appName);
      if (s.primaryColor) {
        setPrimaryColor(s.primaryColor);
        document.documentElement.style.setProperty("--accent", s.primaryColor);
        document.documentElement.style.setProperty("--accent-glow", s.primaryColor + "66");
      }
    });
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="flex items-center justify-between px-6 py-3 max-w-screen-2xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <Logo size="md" />
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="text-zinc-300 hover:text-white transition">Home</Link>
          <Link href="/browse" className="text-zinc-300 hover:text-white transition">Browse</Link>
          {user && <Link href="/my-list" className="text-zinc-300 hover:text-white transition">My List</Link>}
          {user && <Link href="/pricing" className="text-zinc-300 hover:text-white transition">Plans</Link>}
          <Link href="/search" className="text-zinc-300 hover:text-white transition">Search</Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/account" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
                  {user.name?.charAt(0) || "U"}
                </div>
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="btn-primary text-xs py-1.5 px-3">Admin</Link>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-secondary text-xs py-1.5 px-3">Sign In</Link>
              <Link href="/register" className="btn-primary text-xs py-1.5 px-3">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}