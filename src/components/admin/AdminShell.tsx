"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/content", label: "Content", icon: "📚" },
  { href: "/admin/upload", label: "Upload", icon: "📤" },
  { href: "/admin/teacher", label: "Teacher", icon: "👨‍🏫" },
  { href: "/admin/live", label: "Live Classes", icon: "📡" },
  { href: "/admin/payments", label: "Payments", icon: "💰" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.role !== "admin") window.location.href = "/";
      setUser(d);
    });
  }, []);

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 glass-strong border-r border-white/5 flex flex-col fixed h-full z-40">
        <div className="p-4 border-b border-white/5">
          <Logo size="sm" />
          <p className="text-[10px] text-zinc-600 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 text-sm rounded-lg px-3 py-2 transition ${
                pathname === item.href
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400">← Back to App</Link>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-6">{children}</main>
    </div>
  );
}