"use client";

import { useState, useEffect } from "react";

type AppSettingsState = {
  groqApiKey: string;
  bunnyLibraryId: string;
  bunnyApiKey: string;
  bunnyCdnHostname: string;
  databaseUrl: string;
  auth0Domain: string;
  auth0ClientId: string;
  auth0ClientSecret: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  appUrl: string;
  appName: string;
  maintenanceMode: string;
  maxFreeVideos: string;
  maxFreeAi: string;
  primaryColor: string;
  logoUrl: string;
  welcomeMessage: string;
};

const MASK = "••••••••";

function masked(val?: string) {
  return val && val !== MASK ? val : "";
}

export function SettingsForm() {
  const [settings, setSettings] = useState<AppSettingsState>({
    groqApiKey: "", bunnyLibraryId: "", bunnyApiKey: "", bunnyCdnHostname: "",
    databaseUrl: "", auth0Domain: "", auth0ClientId: "", auth0ClientSecret: "",
    stripeSecretKey: "", stripeWebhookSecret: "", razorpayKeyId: "", razorpayKeySecret: "",
    appUrl: "", appName: "Arynox-EDU", maintenanceMode: "false",
    maxFreeVideos: "10", maxFreeAi: "1",
    primaryColor: "#7c3aed", logoUrl: "", welcomeMessage: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [testStatus, setTestStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => {
      if (d) setSettings((prev) => ({ ...prev, ...d }));
    });
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d) setTestStatus({
        groq: d.hasGroqKey ? "✅ Configured" : "❌ Not set",
        bunny: d.hasBunny ? "✅ Ready" : "❌ Not set",
        auth0: d.hasAuth0 ? "✅ Configured" : "❌ Not set",
        maintenance: d.maintenanceMode ? "🔴 Enabled" : "✅ Disabled",
      });
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("✅ All settings saved & propagated to all users instantly!");
      await fetch("/api/settings");
      const pub = await fetch("/api/settings").then((r) => r.json());
      setTestStatus({
        groq: pub.hasGroqKey ? "✅ Active" : "❌ Not set",
        bunny: pub.hasBunny ? "✅ Ready" : "❌ Not set",
        auth0: pub.hasAuth0 ? "✅ Configured" : "❌ Not set",
        maintenance: pub.maintenanceMode ? "🔴 Enabled" : "✅ Disabled",
      });
    } else {
      setMessage(data.error || "Failed to save");
    }
    setLoading(false);
  };

  const handleTest = async (service: string) => {
    setTestStatus((prev) => ({ ...prev, [service]: "Testing..." }));
    try {
      if (service === "groq") {
        const res = await fetch("/api/ai/tutor", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: "Say connected and nothing else", context: "" }),
        });
        const d = await res.json();
        setTestStatus((prev) => ({ ...prev, groq: d.content ? "✅ Working!" : "❌ Failed" }));
      } else if (service === "bunny") {
        setTestStatus((prev) => ({ ...prev, bunny: settings.bunnyLibraryId ? "✅ Library ID set" : "❌ Missing Library ID" }));
      } else if (service === "auth0") {
        setTestStatus((prev) => ({ ...prev, auth0: settings.auth0Domain && settings.auth0ClientId ? "✅ Configured" : "❌ Missing Domain or Client ID" }));
      }
    } catch {
      setTestStatus((prev) => ({ ...prev, [service]: "❌ Error" }));
    }
  };

  const Input = ({ label, field, type = "text", placeholder = "", secret = false }: { label: string; field: keyof typeof settings; type?: string; placeholder?: string; secret?: boolean }) => (
    <div>
      <label className="text-xs text-zinc-400 mb-1 block">{label}</label>
      <input
        value={settings[field]}
        onChange={(e) => setSettings({ ...settings, [field]: e.target.value })}
        className="input-field"
        type={type}
        placeholder={secret ? "••••••••" : placeholder}
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(testStatus).map(([key, val]) => (
          <div key={key} className="glass rounded-lg p-3 text-xs">
            <p className="text-zinc-500 uppercase tracking-wider mb-1">{key}</p>
            <p className="text-white font-medium">{val}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">AI (Groq)</h2>
          <button onClick={() => handleTest("groq")} className="text-[10px] text-violet-400 hover:text-violet-300">Test</button>
        </div>
        <Input label="Groq API Key" field="groqApiKey" type="password" secret placeholder="gsk_..." />
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Bunny.net (Video)</h2>
          <button onClick={() => handleTest("bunny")} className="text-[10px] text-violet-400 hover:text-violet-300">Test</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Library ID" field="bunnyLibraryId" />
          <Input label="API Key" field="bunnyApiKey" type="password" secret />
        </div>
        <Input label="CDN Hostname" field="bunnyCdnHostname" placeholder="vz-xxxx.b-cdn.net" />
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Database (Turso)</h2>
        <Input label="DATABASE_URL (libsql://...)" field="databaseUrl" type="password" secret placeholder="libsql://..." />
        <p className="text-[10px] text-zinc-600">DATABASE_URL in .env takes priority over DB value on server restart.</p>
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Auth0 (Authentication)</h2>
          <button onClick={() => handleTest("auth0")} className="text-[10px] text-violet-400 hover:text-violet-300">Test</button>
        </div>
        <Input label="Auth0 Domain" field="auth0Domain" placeholder="dev-xxx.us.auth0.com" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Client ID" field="auth0ClientId" type="password" secret />
          <Input label="Client Secret" field="auth0ClientSecret" type="password" secret />
        </div>
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Payments</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Stripe Secret Key" field="stripeSecretKey" type="password" secret />
          <Input label="Stripe Webhook Secret" field="stripeWebhookSecret" type="password" secret />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Razorpay Key ID" field="razorpayKeyId" />
          <Input label="Razorpay Key Secret" field="razorpayKeySecret" type="password" secret />
        </div>
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">App Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="App Name" field="appName" placeholder="Arynox-EDU" />
          <Input label="App URL" field="appUrl" placeholder="https://yourdomain.com" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Max Free Videos" field="maxFreeVideos" placeholder="10" />
          <Input label="Max Free AI Uses" field="maxFreeAi" placeholder="1" />
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Maintenance Mode</label>
            <select value={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.value })} className="input-field">
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Branding (Pushed to All Users)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Primary Color</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10" />
              <input value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="input-field flex-1" />
            </div>
          </div>
          <Input label="Logo URL" field="logoUrl" placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Welcome Message</label>
          <textarea value={settings.welcomeMessage} onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })} className="input-field" rows={2} placeholder="Welcome to Arynox-EDU!" />
        </div>
      </div>

      {message && (
        <div className={`rounded-xl p-4 text-sm ${message.includes("saved") ? "bg-green-500/10 border border-green-500/30 text-green-300" : "bg-red-500/10 border border-red-500/30 text-red-300"}`}>
          {message}
        </div>
      )}

      <button onClick={handleSave} disabled={loading} className="btn-primary text-sm w-full">
        {loading ? "Saving & Propagating..." : "Save All Settings (Instant Propagation)"}
      </button>
    </div>
  );
}