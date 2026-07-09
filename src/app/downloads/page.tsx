"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useSession } from "@/lib/client-session";

interface Download {
  id: string;
  lectureId: string;
  lectureTitle?: string;
  lectureThumbnail?: string;
  downloadedAt: string;
  fileSize: number | null;
  expiresAt: string | null;
}

export default function DownloadsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDownloads = () => {
    setLoading(true);
    fetch("/api/download")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch downloads");
        return r.json();
      })
      .then((data) => {
        setDownloads(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!sessionLoading && !user) return;
    fetchDownloads();
  }, [user, sessionLoading]);

  const handleDelete = async (downloadId: string) => {
    setDeleting(downloadId);
    try {
      const res = await fetch(`/api/download?id=${downloadId}`, { method: "DELETE" });
      if (res.ok) {
        setDownloads((prev) => prev.filter((d) => d.id !== downloadId));
      }
    } catch {}
    setDeleting(null);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  if (sessionLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <Navbar user={user} />
      <div className="pt-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">Offline Downloads</h1>
          <p className="text-zinc-400 mt-1">Your downloaded lectures for offline viewing</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <div className="aspect-video loading-shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 loading-shimmer rounded w-3/4" />
                  <div className="h-3 loading-shimmer rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-8 text-center text-zinc-400">{error}</div>
        ) : downloads.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <p className="text-zinc-400 text-lg font-medium">No downloads yet</p>
            <p className="text-zinc-500 text-sm mt-1">Download lectures to watch offline.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {downloads.map((d) => (
              <div key={d.id} className="glass rounded-xl overflow-hidden group">
                <div className="aspect-video bg-zinc-800/50 flex items-center justify-center">
                  {d.lectureThumbnail ? (
                    <img src={d.lectureThumbnail} alt={d.lectureTitle || "Lecture"} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium text-sm truncate">{d.lectureTitle || "Untitled Lecture"}</h3>
                  <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
                    <span>{new Date(d.downloadedAt).toLocaleDateString()}</span>
                    <span>{formatSize(d.fileSize)}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(d.id)}
                    disabled={deleting === d.id}
                    className="mt-3 w-full btn-secondary text-xs py-1.5 text-red-400 hover:text-red-300"
                  >
                    {deleting === d.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
