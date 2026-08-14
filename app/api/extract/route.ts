import { NextRequest, NextResponse } from 'next/server';
import { parseYouTubeHTML, parseDurationToSeconds, formatSecondsToHumanReadable, extractPlaylistId } from '@/lib/parser';
import { ExtractResponse } from '@/type';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let url = body.url || '';

    if (!url || !url.trim()) {
      return NextResponse.json<ExtractResponse>(
        {
          success: false,
          items: [],
          totalVideos: 0,
          totalDurationSeconds: 0,
          totalDurationFormatted: '0 sec',
          error: 'Please provide a YouTube playlist link or video playlist URL.',
        },
        { status: 400 }
      );
    }

    const playlistId = extractPlaylistId(url);
    // Always target the standard canonical playlist page for complete playlist listings
    const targetUrl = playlistId 
      ? `https://www.youtube.com/playlist?list=${playlistId}`
      : url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
    });

    if (!response.ok) {
      return NextResponse.json<ExtractResponse>(
        {
          success: false,
          items: [],
          totalVideos: 0,
          totalDurationSeconds: 0,
          totalDurationFormatted: '0 sec',
          error: `Failed to fetch YouTube page (HTTP ${response.status})`,
        },
        { status: 400 }
      );
    }

    const rawHtml = await response.text();
    const { items, playlistTitle } = parseYouTubeHTML(rawHtml);

    if (items.length === 0) {
      return NextResponse.json<ExtractResponse>(
        {
          success: false,
          items: [],
          totalVideos: 0,
          totalDurationSeconds: 0,
          totalDurationFormatted: '0 sec',
          error: 'Could not extract playlist items. The playlist may be private or unavailable.',
        },
        { status: 422 }
      );
    }

    const totalSeconds = items.reduce(
      (acc, item) => acc + parseDurationToSeconds(item.duration),
      0
    );
    const formattedDuration = formatSecondsToHumanReadable(totalSeconds);

    return NextResponse.json<ExtractResponse>({
      success: true,
      title: playlistTitle || 'YouTube Playlist',
      totalVideos: items.length,
      totalDurationSeconds: totalSeconds,
      totalDurationFormatted: formattedDuration,
      items,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json<ExtractResponse>(
      {
        success: false,
        items: [],
        totalVideos: 0,
        totalDurationSeconds: 0,
        totalDurationFormatted: '0 sec',
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
