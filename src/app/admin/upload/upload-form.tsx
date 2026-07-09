"use client";

import { useState, useRef } from "react";

export function UploadForm({ skills, modules }: { skills: any[]; modules: any[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillId, setSkillId] = useState(skills[0]?.id || "");
  const [moduleId, setModuleId] = useState("");
  const [tierRequired, setTierRequired] = useState("free_trial");
  const [mode, setMode] = useState<"url" | "bunny">("url");
  const [mp4Url, setMp4Url] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [eNotes, setENotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredModules = modules.filter((m: any) => m.skillId === skillId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setUploadProgress(0);

    try {
      if (mode === "url") {
        const res = await fetch("/api/admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, skillId, moduleId: moduleId || null, tierRequired, mp4Url, eNotes }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage("Lecture created successfully!");
          setTitle(""); setDescription(""); setMp4Url(""); setFile(null);
        } else {
          setMessage(data.error || "Upload failed");
        }
        setLoading(false);
        return;
      }

      // Bunny.net mode — create video record first
      const createRes = await fetch("/api/admin/bunny/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setMessage(createData.error || "Failed to create Bunny video");
        setLoading(false);
        return;
      }

      // Upload file directly to Bunny's storage
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", createData.uploadUrl);
      xhr.setRequestHeader("AccessKey", createData.accessKey);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          setUploadProgress(Math.round((evt.loaded / evt.total) * 80));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      setUploadProgress(85);

      // Save lecture metadata
      await new Promise((r) => setTimeout(r, 1000));
      setUploadProgress(95);
      const saveRes = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, skillId, moduleId: moduleId || null, tierRequired,
          uploadBunny: true, bunnyVideoId: createData.videoId, eNotes,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        setMessage(saveData.error || "Failed to save lecture");
        setLoading(false);
        return;
      }

      setUploadProgress(100);
      setMessage("Lecture created and video uploaded successfully!");
      setTitle(""); setDescription(""); setMp4Url(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" required />
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Skill</label>
          <select value={skillId} onChange={(e) => { setSkillId(e.target.value); setModuleId(""); }} className="input-field">
            {skills.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Module</label>
          <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="input-field">
            <option value="">No module</option>
            {filteredModules.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Tier Required</label>
        <select value={tierRequired} onChange={(e) => setTierRequired(e.target.value)} className="input-field">
          <option value="free_trial">Free Trial</option>
          <option value="basic">Basic</option>
          <option value="plus">Plus</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-1 block">📄 E-Notes for Students (optional)</label>
        <textarea value={eNotes} onChange={(e) => setENotes(e.target.value)} className="input-field" rows={4} placeholder="Markdown supported... Provide study notes that students can download as PDF" />
      </div>

      <div className="flex gap-4 border-b border-zinc-700 pb-3">
        <button type="button" onClick={() => setMode("url")} className={`text-xs px-3 py-1 rounded ${mode === "url" ? "bg-violet-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>
          MP4 URL
        </button>
        <button type="button" onClick={() => setMode("bunny")} className={`text-xs px-3 py-1 rounded ${mode === "bunny" ? "bg-violet-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>
          Upload File (Bunny.net CDN)
        </button>
      </div>

      {mode === "url" ? (
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Video URL (MP4)</label>
          <input value={mp4Url} onChange={(e) => setMp4Url(e.target.value)} className="input-field" placeholder="https://..." />
        </div>
      ) : (
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Select Video File</label>
          <input ref={fileRef} type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-violet-600 file:text-white" />
        </div>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-zinc-700 rounded-full h-2">
          <div className="bg-violet-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}
      {uploadProgress === 100 && <p className="text-xs text-green-400">Upload complete!</p>}

      {message && <p className={`text-xs ${message.includes("success") ? "text-green-400" : "text-red-400"}`}>{message}</p>}

      <button type="submit" disabled={loading || (mode === "bunny" && !file)} className="btn-primary text-sm">
        {loading ? (mode === "bunny" ? `Uploading ${uploadProgress}%...` : "Saving...") : "Create Lecture"}
      </button>
    </form>
  );
}