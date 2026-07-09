"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Logo } from "./Logo";
import type { User } from "@/db/schema";

export function Navbar({ user }: { user: Partial<User> | null }) {
  const [appName, setAppName] = useState("Arynox-EDU");
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showParent = user && (user.role === "parent" || user.role === "user");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="flex items-center justify-between px-6 py-3 max-w-screen-2xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <Logo size="md" />
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="text-zinc-300 hover:text-white transition">Home</Link>
          <Link href="/browse" className="text-zinc-300 hover:text-white transition">Browse</Link>
          <Link href="/pricing" className="text-zinc-300 hover:text-white transition">Plans</Link>
          {user && <Link href="/my-list" className="text-zinc-300 hover:text-white transition">My List</Link>}
          {user && <Link href="/progress" className="text-zinc-300 hover:text-white transition">Progress</Link>}
          {user && <Link href="/leaderboard" className="text-zinc-300 hover:text-white transition">Leaderboard</Link>}
          {user && <Link href="/challenges" className="text-zinc-300 hover:text-white transition">Challenges</Link>}
          {user && <Link href="/batch" className="text-zinc-300 hover:text-white transition">Live Classes</Link>}
          {showParent && <Link href="/parent" className="text-zinc-300 hover:text-white transition">Parent</Link>}
          <Link href="/search" className="text-zinc-300 hover:text-white transition">Search</Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
                  {user.name?.charAt(0) || "U"}
                </div>
                <span className="hidden sm:inline">{user.name}</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 glass rounded-xl py-2 shadow-xl z-50">
                  <Link href="/account" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5">My Account</Link>
                  <Link href="/downloads" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5">Downloads</Link>
                  {user.role === "admin" && (
                    <Link href="/admin" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5">Admin Panel</Link>
                  )}
                  <hr className="my-1 border-white/5" />
                  <button
                    onClick={async () => {
                      await fetch("/api/auth/logout");
                      window.location.href = "/";
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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
