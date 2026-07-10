"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Show OAuth errors from URL params (e.g. ?error=token_exchange_failed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      const messages: Record<string, string> = {
        no_code: "No authorization code received from provider",
        auth0_not_configured: "Auth0 is not configured. Contact admin.",
        token_exchange_failed: "Failed to exchange authorization code. Check Auth0 callback URL configuration.",
        userinfo_failed: "Failed to fetch user info from provider.",
        database_error: "Database connection error.",
      };
      setError(messages[err] || `OAuth error: ${err}`);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/oauth?provider=${provider}`);
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm glass rounded-2xl p-8">
        <div className="text-center mb-6">
          <Logo size="lg" showTagline />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full text-sm">{loading ? "Signing in..." : "Sign In"}</button>
        </form>

        <div className="mt-6">
          <div className="text-center text-xs text-zinc-500 mb-3">Or continue with</div>
          <div className="space-y-2">
            <button onClick={() => handleOAuth("google")} disabled={loading} className="btn-secondary w-full text-xs flex items-center justify-center gap-2">
              <span>G</span> Google
            </button>
            <button onClick={() => handleOAuth("github")} disabled={loading} className="btn-secondary w-full text-xs flex items-center justify-center gap-2">
              <span>GH</span> GitHub
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-6">
          Don't have an account? <a href="/register" className="text-violet-400 hover:text-violet-300">Sign up</a>
        </p>
        <p className="text-center text-xs text-zinc-600 mt-2">
          Demo Admin: admin@arynoxtech.edu / admin123
        </p>
      </div>
    </div>
  );
}