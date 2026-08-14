import { ResultItem } from '@/type';

export function parseDurationToSeconds(durationStr: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map(Number);
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
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} sec${seconds !== 1 ? 's' : ''}`);

  return parts.join(' ');
}

export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  
  // Direct playlist ID format
  if (/^[A-Za-z0-9_-]{12,}$/.test(trimmed) && !trimmed.startsWith('http')) {
    return trimmed;
  }

  // Extract from list= URL param
  const listParamMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listParamMatch && listParamMatch[1]) {
    return listParamMatch[1];
  }

  return null;
}

// Deep search helper to find all video items inside any ytInitialData JSON hierarchy
function findVideosInObject(obj: any, items: ResultItem[], seenTitles: Set<string>) {
  if (!obj || typeof obj !== 'object') return;

  // Pattern 1: lockupViewModel
  if (obj.lockupViewModel) {
    const lvm = obj.lockupViewModel;
    const title = lvm.metadata?.lockupMetadataViewModel?.title?.content || '';
    
    // Look for badge text
    let duration = '';
    const badges = lvm.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges || [];
    for (const b of badges) {
      if (b.thumbnailBadgeViewModel?.text) {
        duration = b.thumbnailBadgeViewModel.text;
        break;
      }
    }

    const videoId = lvm.contentId || '';

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

  // Pattern 2: playlistVideoRenderer
  if (obj.playlistVideoRenderer) {
    const pvr = obj.playlistVideoRenderer;
    const title = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText || '';
    const duration = pvr.lengthText?.simpleText || pvr.lengthText?.runs?.[0]?.text || '';
    const videoId = pvr.videoId || '';

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

  // Pattern 3: playlistPanelVideoRenderer (found in watch?v=...&list=... pages)
  if (obj.playlistPanelVideoRenderer) {
    const ppvr = obj.playlistPanelVideoRenderer;
    const title = ppvr.title?.simpleText || ppvr.title?.runs?.[0]?.text || '';
    const duration = ppvr.lengthText?.simpleText || ppvr.lengthText?.runs?.[0]?.text || '';
    const videoId = ppvr.videoId || '';

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

  // Recursively search children
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

export function parseYouTubeHTML(htmlContent: string): { items: ResultItem[]; playlistTitle?: string } {
  const items: ResultItem[] = [];
  const seenTitles = new Set<string>();
  let playlistTitle: string | undefined;

  // Title extraction
  const pageTitleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
  if (pageTitleMatch) {
    playlistTitle = pageTitleMatch[1].replace(' - YouTube', '').trim();
  }

  // Extract from ytInitialData JS object
  const initialDataMatch = htmlContent.match(/var ytInitialData\s*=\s*({.+?});\s*<\/script>/s) ||
                            htmlContent.match(/window\["ytInitialData"\]\s*=\s*({.+?});/s);

  if (initialDataMatch) {
    try {
      const data = JSON.parse(initialDataMatch[1]);
      findVideosInObject(data, items, seenTitles);
    } catch {
      // ignore JSON parse errors and continue to fallback
    }
  }

  // Fallback: Regex extraction on lockup blocks
  if (items.length === 0) {
    const lockupRegex = /<yt-lockup-view-model[\s\S]*?<\/yt-lockup-view-model>/g;
    let match: RegExpExecArray | null;

    while ((match = lockupRegex.exec(htmlContent)) !== null) {
      const block = match[0];

      let title = '';
      const titleSpanMatch = block.match(/class="ytLockupMetadataViewModelTitle"[^>]*>[\s\S]*?<span[^>]*>(.*?)<\/span>/s);
      const titleAttrMatch = block.match(/title="([^"]+)"/);

      if (titleSpanMatch && titleSpanMatch[1]) {
        title = titleSpanMatch[1].trim();
      } else if (titleAttrMatch && titleAttrMatch[1]) {
        title = titleAttrMatch[1].trim();
      }

      let duration = '';
      const durationMatch = block.match(/<div class="ytBadgeShapeText">([^<]+)<\/div>/) ||
                            block.match(/aria-label="[^"]*?(\d+:\d+|\d+:\d+:\d+)[^"]*?"/);
      if (durationMatch) {
        duration = durationMatch[1].trim();
      }

      let videoId = '';
      const videoIdMatch = block.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (videoIdMatch) {
        videoId = videoIdMatch[1];
      }

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
  }

  return { items, playlistTitle };
}
