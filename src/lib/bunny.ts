export type BunnyConfig = {
  libraryId: string;
  apiKey: string;
  cdnHostname?: string | null;
};

export async function createBunnyVideo(config: BunnyConfig, title: string): Promise<{ videoId: string; embedUrl: string; hlsUrl: string } | { error: string }> {
  try {
    const res = await fetch(`https://video.bunnycdn.com/library/${config.libraryId}/videos`, {
      method: "POST",
      headers: { AccessKey: config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `Bunny create failed (${res.status}): ${text.slice(0, 200)}` };
    }

    const data = (await res.json()) as { guid: string };
    const videoId = data.guid;
    const host = config.cdnHostname || `vz-${config.libraryId}.b-cdn.net`;
    return {
      videoId,
      embedUrl: `https://iframe.mediadelivery.net/embed/${config.libraryId}/${videoId}`,
      hlsUrl: `https://${host}/${videoId}/playlist.m3u8`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Bunny Stream request failed" };
  }
}

export function getBunnyUploadUrl(config: BunnyConfig, videoId: string) {
  return {
    uploadUrl: `https://video.bunnycdn.com/library/${config.libraryId}/videos/${videoId}`,
    headers: { AccessKey: config.apiKey, "Content-Type": "application/octet-stream" },
  };
}

export async function getBunnyVideoStatus(config: BunnyConfig, videoId: string) {
  try {
    const res = await fetch(`https://video.bunnycdn.com/library/${config.libraryId}/videos/${videoId}`, {
      headers: { AccessKey: config.apiKey }, cache: "no-store",
    });
    if (!res.ok) return { error: `Status check failed (${res.status})` };
    return await res.json();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Status check failed" };
  }
}