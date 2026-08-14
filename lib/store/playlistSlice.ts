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

// 1 Day in milliseconds: 24 * 60 * 60 * 1000 = 86,400,000 ms
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
      // Store in cache with current timestamp
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
        if (now - state.cache[key].timestamp > ONE_DAY_MS) {
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
