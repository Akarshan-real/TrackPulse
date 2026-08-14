import { ResultItem } from "@/type";

export function parseDurationToSeconds(durationStr: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

export function formatSecondsToHumanReadable(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} sec${seconds !== 1 ? "s" : ""}`);

  return parts.join(" ");
}

export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  
  if (/^[A-Za-z0-9_-]{12,}$/.test(trimmed) && !trimmed.startsWith("http")) {
    return trimmed;
  }

  const listParamMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listParamMatch && listParamMatch[1]) {
    return listParamMatch[1];
  }

  return null;
}

export function findContinuationTokens(obj: any, tokens: string[] = []): string[] {
  if (!obj || typeof obj !== "object") return tokens;
  if (obj.continuationCommand && obj.continuationCommand.token) {
    tokens.push(obj.continuationCommand.token);
  }
  if (Array.isArray(obj)) {
    for (const item of obj) findContinuationTokens(item, tokens);
  } else {
    for (const k of Object.keys(obj)) findContinuationTokens(obj[k], tokens);
  }
  return tokens;
}

export function findVideosInObject(obj: any, items: ResultItem[], seenTitles: Set<string>) {
  if (!obj || typeof obj !== "object") return;

  if (obj.lockupViewModel) {
    const lvm = obj.lockupViewModel;
    const title = lvm.metadata?.lockupMetadataViewModel?.title?.content || "";
    
    let duration = "";
    const overlays = lvm.contentImage?.thumbnailViewModel?.overlays || [];
    for (const ov of overlays) {
      const badges = ov.thumbnailBottomOverlayViewModel?.badges || [];
      for (const b of badges) {
        if (b.thumbnailBadgeViewModel?.text) {
          duration = b.thumbnailBadgeViewModel.text;
          break;
        }
      }
    }

    const videoId = lvm.contentId || "";

    if (title && !seenTitles.has(title)) {
      seenTitles.add(title);
      items.push({
        id: items.length + 1,
        title,
        duration,
        videoId
      });
    }
  }

  if (obj.playlistVideoRenderer) {
    const pvr = obj.playlistVideoRenderer;
    const title = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText || "";
    const duration = pvr.lengthText?.simpleText || pvr.lengthText?.runs?.[0]?.text || "";
    const videoId = pvr.videoId || "";

    if (title && !seenTitles.has(title)) {
      seenTitles.add(title);
      items.push({
        id: items.length + 1,
        title,
        duration,
        videoId
      });
    }
  }

  if (obj.playlistPanelVideoRenderer) {
    const ppvr = obj.playlistPanelVideoRenderer;
    const title = ppvr.title?.simpleText || ppvr.title?.runs?.[0]?.text || "";
    const duration = ppvr.lengthText?.simpleText || ppvr.lengthText?.runs?.[0]?.text || "";
    const videoId = ppvr.videoId || "";

    if (title && !seenTitles.has(title)) {
      seenTitles.add(title);
      items.push({
        id: items.length + 1,
        title,
        duration,
        videoId
      });
    }
  }

  if (Array.isArray(obj)) {
    for (const child of obj) {
      findVideosInObject(child, items, seenTitles);
    }
  } else {
    for (const key of Object.keys(obj)) {
      findVideosInObject(obj[key], items, seenTitles);
    }
  }
}

export function parseYouTubeHTML(htmlContent: string): { 
  items: ResultItem[]; 
  playlistTitle?: string; 
  apiKey?: string; 
  clientVersion?: string;
  continuationToken?: string;
} {
  const items: ResultItem[] = [];
  const seenTitles = new Set<string>();
  let playlistTitle: string | undefined;

  const pageTitleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
  if (pageTitleMatch) {
    playlistTitle = pageTitleMatch[1].replace(" - YouTube", "").trim();
  }

  const apiKeyMatch = htmlContent.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const clientVersionMatch = htmlContent.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1] : undefined;
  const clientVersion = clientVersionMatch ? clientVersionMatch[1] : undefined;

  let continuationToken: string | undefined;

  const initialDataMatch = htmlContent.match(/var ytInitialData\s*=\s*({.+?});\s*<\/script>/s) ||
                            htmlContent.match(/window\["ytInitialData"\]\s*=\s*({.+?});/s);

  if (initialDataMatch) {
    try {
      const data = JSON.parse(initialDataMatch[1]);
      findVideosInObject(data, items, seenTitles);
      const tokens = findContinuationTokens(data);
      if (tokens.length > 0) {
        continuationToken = tokens[0];
      }
    } catch {
      // ignore
    }
  }

  return { items, playlistTitle, apiKey, clientVersion, continuationToken };
}
