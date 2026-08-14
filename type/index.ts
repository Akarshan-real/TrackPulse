export interface ResultItem {
  id: number;
  title: string;
  duration: string;
  videoId?: string;
  thumbnail?: string;
}

export interface ExtractResponse {
  success: boolean;
  title?: string;
  totalVideos: number;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
  items: ResultItem[];
  error?: string;
}

export default ResultItem;