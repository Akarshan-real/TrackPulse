import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ExtractResponse } from '@/type';

export interface CacheEntry {
  data: ExtractResponse;
  timestamp: number; // in milliseconds
}

interface PlaylistState {
  cache: Record<string, CacheEntry>; // key is normalized playlist URL or ID
  currentResult: ExtractResponse | null;
  lastSearchedUrl: string;
}

const initialState: PlaylistState = {
  cache: {},
  currentResult: null,
  lastSearchedUrl: '',
};

// 12 Hours in milliseconds: 12 * 60 * 60 * 1000 = 43,200,000 ms
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export const playlistSlice = createSlice({
  name: 'playlist',
  initialState,
  reducers: {
    setPlaylistResult: (
      state,
      action: PayloadAction<{ key: string; result: ExtractResponse }>
    ) => {
      const { key, result } = action.payload;
      state.currentResult = result;
      state.lastSearchedUrl = key;
      state.cache[key] = {
        data: result,
        timestamp: Date.now(),
      };
    },
    setCurrentResult: (state, action: PayloadAction<ExtractResponse | null>) => {
      state.currentResult = action.payload;
    },
    cleanExpiredCache: (state) => {
      const now = Date.now();
      Object.keys(state.cache).forEach((key) => {
        if (now - state.cache[key].timestamp > TWELVE_HOURS_MS) {
          delete state.cache[key];
        }
      });
    },
    clearCache: (state) => {
      state.cache = {};
      state.currentResult = null;
    },
  },
});

export const { setPlaylistResult, setCurrentResult, cleanExpiredCache, clearCache } =
  playlistSlice.actions;

export default playlistSlice.reducer;
