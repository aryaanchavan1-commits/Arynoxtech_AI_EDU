"use client";

export function VideoPlayer({ src, poster, onProgress }: { src?: string; poster?: string; onProgress?: (pos: number) => void }) {
  return (
    <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden">
      {src ? (
        <video
          className="w-full h-full object-contain"
          src={src}
          poster={poster}
          controls
          onTimeUpdate={(e) => onProgress?.(e.currentTarget.currentTime)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-600">
          <div className="text-center">
            <p className="text-lg">🎬</p>
            <p className="text-sm mt-2">No video URL configured</p>
          </div>
        </div>
      )}
    </div>
  );
}