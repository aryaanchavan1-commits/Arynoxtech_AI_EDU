"use client";

import { useState, useEffect } from "react";

export function useSession() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setUser(d || null); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  return { user, loading };
}

export async function fetchSession() {
  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) return await res.json();
  } catch {}
  return null;
}
